import { useMemoizedFn } from 'ahooks'
import { Select, Table, InputNumber, Button, Popconfirm } from 'antd'
import { DeleteOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'

import { Item } from '@/components'
import { getLocale } from '@umijs/max'

import styles from './index.less'

import type { SelectProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Component } from '@/types'

interface ProductItem {
  id: number
  value: number
  label: string
  name: string
  spu?: string
  barcode?: string
  spec?: string
  purchase_price?: number
  wholesale_price?: number
  suggested_price?: number
  retail_price?: number
  [key: string]: any
}

interface ProductTableValue {
  product_id: number
  quantity: number
  price: number
  wholesale_price?: number
  retail_price?: number
  suggested_retail_price?: number
  discount?: number
  subtotal?: number
  [key: string]: any
}

interface PriceField {
  key: string
  label: string
  sourceField?: string
  width?: number
  precision?: number
  min?: number
  max?: number
}

interface IProps extends Component.PropsEditComponent {
  value?: number[] | ProductTableValue[]
  onChange?: (value: ProductTableValue[]) => void
  xProps?: {
    remote?: {
      api: string
      params?: Record<string, any>
    }
    placeholder?: string
    priceFields?: PriceField[]
    showSubtotal?: boolean
    subtotalFormula?: string
  }
  options?: SelectProps['options']
}

const defaultPriceFields: PriceField[] = [
  { key: 'price', label: '单价', sourceField: 'purchase_price', width: 100, precision: 2, min: 0 }
]

const Index = (props: IProps) => {
  const { __name, __bind, itemProps, value = [], onChange, xProps, options = [] } = props
  const is_cn = getLocale() === 'zh-CN'
  const priceFields = xProps?.priceFields || defaultPriceFields
  const showSubtotal = xProps?.showSubtotal !== false

  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // 解析已选中的商品ID
  const selectedIds = useMemo(() => {
    if (!value || value.length === 0) return []
    if (typeof value[0] === 'object') {
      return (value as ProductTableValue[]).map((v) => v.product_id)
    }
    return value as number[]
  }, [value])

  // 获取商品详情的格式化数据
  const productTableValues = useMemo(() => {
    if (!value || value.length === 0) return []
    if (typeof value[0] === 'object') {
      return value as ProductTableValue[]
    }
    return (value as number[]).map((id) => {
      const item: ProductTableValue = {
        product_id: id,
        quantity: 1,
        price: 0
      }
      priceFields.forEach((field) => {
        if (field.key !== 'price') {
          (item as any)[field.key] = 0
        }
      })
      return item
    })
  }, [value, priceFields])

  // 加载已选中的商品详情
  useEffect(() => {
    if (selectedIds.length === 0) {
      setSelectedProducts([])
      return
    }

    const loadSelectedProducts = async () => {
      if (!xProps?.remote?.api) return

      try {
        setLoading(true)
        const ids = selectedIds.join(',')
        const response = await fetch(`${xProps.remote.api}?selected=${ids}`)
        const data = await response.json()
        if (Array.isArray(data)) {
          const merged = data.map((product: ProductItem) => {
            const tableValue = productTableValues.find(
              (v) => v.product_id === product.id || v.product_id === product.value
            )
            const item: any = {
              ...product,
              quantity: tableValue?.quantity || 1
            }
            priceFields.forEach((field) => {
              const sourceValue = field.sourceField ? (product as any)[field.sourceField] : undefined
              item[field.key] = tableValue?.[field.key] ?? sourceValue ?? 0
            })
            return item
          })
          setSelectedProducts(merged)
        }
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSelectedProducts()
  }, [selectedIds.length, xProps?.remote?.api, priceFields, productTableValues])

  // 远程搜索
  const fetchRemoteOptions = async (keywords: string) => {
    if (!xProps?.remote?.api) return []

    try {
      const params: Record<string, any> = { ...xProps.remote.params }
      if (keywords) {
        params.keywords = keywords.trim()
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${xProps.remote.api}?${queryString}`)
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Failed to search products:', error)
      return []
    }
  }

  // 处理搜索
  const handleSearch = useMemoizedFn(async (keyword: string) => {
    setSearchValue(keyword)
    if (keyword && xProps?.remote?.api) {
      return await fetchRemoteOptions(keyword)
    }
    return []
  })

  // 处理选择变化
  const handleChange = useMemoizedFn(
    (ids: number[] | number | null) => {
      if (!onChange) return

      const newIds = ids ? (Array.isArray(ids) ? ids : [ids]) : []
      const existingValues = productTableValues.filter((v) => newIds.includes(v.product_id))
      const newItems: ProductTableValue[] = [...existingValues]

      newIds.forEach((productId) => {
        if (!existingValues.some((v) => v.product_id === productId)) {
          const product = selectedProducts.find((p) => p.id === productId || p.value === productId)
          const item: ProductTableValue = {
            product_id: productId,
            quantity: 1,
            price: 0
          }
          priceFields.forEach((field) => {
            const sourceValue = product ? (product as any)[field.sourceField || field.key] : 0
            ;(item as any)[field.key] = sourceValue ?? 0
          })
          newItems.push(item)
        }
      })

      onChange(newItems)
    }
  )

  // 更新字段
  const handleFieldChange = useMemoizedFn(
    (productId: number, fieldKey: string, fieldValue: number) => {
      if (!onChange) return
      const newValue = productTableValues.map((item) =>
        item.product_id === productId ? { ...item, [fieldKey]: fieldValue } : item
      )
      onChange(newValue)
    }
  )

  // 移除商品
  const handleRemove = useMemoizedFn(
    (productId: number) => {
      if (!onChange) return
      const newValue = productTableValues.filter((item) => item.product_id !== productId)
      onChange(newValue)
    }
  )

  // 计算小计
  const calculateSubtotal = (record: ProductItem) => {
    const item = productTableValues.find(
      (v) => v.product_id === record.id || v.product_id === record.value
    )
    if (!item) return 0
    const quantity = item.quantity || 0
    const price = item.price || 0
    const discount = item.discount ?? 1
    return quantity * price * discount
  }

  // 表格列定义
  const columns: ColumnsType<ProductItem> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
      render: (_, record) => record.name || record.label
    },
    {
      title: '编码',
      dataIndex: 'spu',
      key: 'spu',
      width: 80
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 70
    },
    {
      title: '数量',
      key: 'quantity',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const item = productTableValues.find(
          (v) => v.product_id === record.id || v.product_id === record.value
        )
        return (
          <InputNumber
            min={1}
            size='small'
            value={item?.quantity || 1}
            onChange={(val) => handleFieldChange(record.id || record.value, 'quantity', val as number)}
            style={{ width: '100%' }}
          />
        )
      }
    },
    ...priceFields.map((field) => ({
      title: field.label,
      key: field.key,
      width: field.width || 100,
      align: 'center' as const,
      render: (_: any, record: ProductItem) => {
        const item = productTableValues.find(
          (v) => v.product_id === record.id || v.product_id === record.value
        )
        return (
          <InputNumber
            min={field.min ?? 0}
            max={field.max}
            size='small'
            step={0.01}
            value={item?.[field.key] ?? 0}
            onChange={(val) => handleFieldChange(record.id || record.value, field.key, val as number)}
            precision={field.precision ?? 2}
            style={{ width: '100%' }}
          />
        )
      }
    })),
    ...(showSubtotal
      ? [
          {
            title: '小计(¥)',
            key: 'subtotal',
            width: 90,
            align: 'right' as const,
            render: (_: any, record: ProductItem) => {
              const subtotal = calculateSubtotal(record)
              return <span style={{ fontWeight: 500 }}>¥{subtotal.toFixed(2)}</span>
            }
          }
        ]
      : []),
    {
      title: '操作',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_: any, record: ProductItem) => (
        <Popconfirm
          title='确定移除此商品？'
          onConfirm={() => handleRemove(record.id || record.value)}
          okText='确定'
          cancelText='取消'
        >
          <Button type='text' danger size='small' icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ]

  // 过滤选项
  const availableOptions = useMemo(() => {
    return options.filter((opt) => !selectedIds.includes(opt.value))
  }, [options, selectedIds])

  // 总计
  const totalAmount = useMemo(() => {
    return selectedProducts.reduce((sum, record) => sum + calculateSubtotal(record), 0)
  }, [selectedProducts])

  return (
    <Item {...itemProps} {...{ __bind, __name }}>
      <div className={clsx([styles.product_table_select, 'w_100'])}>
        <Select
          mode='multiple'
          placeholder={
            xProps?.placeholder || is_cn ? '搜索商品名称/编码/条码' : 'Search by name/code/barcode'
          }
          showSearch
          allowClear
          filterOption={false}
          onSearch={handleSearch}
          onChange={handleChange}
          options={availableOptions}
          value={selectedIds}
          loading={loading}
          style={{ width: '100%', marginBottom: 8 }}
          dropdownRender={(menu) => (
            <>
              {menu}
              {searchValue && (
                <div
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: '#1890ff',
                    borderTop: '1px solid #f0f0f0'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <PlusOutlined /> 按回车添加 "{searchValue}"
                </div>
              )}
            </>
          )}
        />
        {selectedProducts.length > 0 && (
          <>
            <Table
              columns={columns}
              dataSource={selectedProducts}
              rowKey={(record) => record.id || record.value}
              size='small'
              pagination={false}
              scroll={{ x: 900 }}
            />
            {showSubtotal && (
              <div
                style={{
                  textAlign: 'right',
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderRadius: '0 0 8px 8px',
                  border: '1px solid #d9d9d9',
                  borderTop: 'none',
                  fontWeight: 500,
                  fontSize: 14
                }}
              >
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                总计: <span style={{ color: '#ff4d4f', fontSize: 16 }}>¥{totalAmount.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </Item>
  )
}

export default observer(Index)
