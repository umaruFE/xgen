import { useMemoizedFn } from 'ahooks'
import { message, Select, Table, InputNumber, Button, Popconfirm } from 'antd'
import { DeleteOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { Item } from '@/components'
import { getLocale } from '@umijs/max'

import styles from './index.less'

import type { SelectProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'

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
  [key: string]: any
}

interface IProps {
  __name?: string
  __bind?: string
  value?: number[] | ProductTableValue[]
  onChange?: (value: ProductTableValue[]) => void
  xProps?: {
    remote?: {
      api: string
      params?: Record<string, any>
    }
    placeholder?: string
  }
  options?: SelectProps['options']
}

const Index = (props: IProps) => {
  const { __name, __bind, value = [], onChange, xProps, options = [] } = props
  const is_cn = getLocale() === 'zh-CN'
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // 解析已选中的商品ID
  const selectedIds = useMemo(() => {
    if (!value || value.length === 0) return []
    // 如果是对象数组，说明包含 quantity 和 price
    if (typeof value[0] === 'object') {
      return (value as ProductTableValue[]).map((v) => v.product_id)
    }
    // 如果是数字数组，直接返回
    return value as number[]
  }, [value])

  // 获取商品详情的格式化数据（包含数量和价格）
  const productTableValues = useMemo(() => {
    if (!value || value.length === 0) return []
    if (typeof value[0] === 'object') {
      return value as ProductTableValue[]
    }
    // 如果只是ID数组，初始化数量和价格
    return (value as number[]).map((id) => ({
      product_id: id,
      quantity: 1,
      price: 0
    }))
  }, [value])

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
          // 合并商品详情和数量价格信息
          const merged = data.map((product: ProductItem) => {
            const tableValue = productTableValues.find(
              (v) => v.product_id === product.id || v.product_id === product.value
            )
            return {
              ...product,
              quantity: tableValue?.quantity || 1,
              price: tableValue?.price || product.purchase_price || product.wholesale_price || 0
            }
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
  }, [selectedIds.length, xProps?.remote?.api])

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

      // 获取现有商品的数量价格信息
      const existingValues = productTableValues.filter((v) => newIds.includes(v.product_id))

      // 为新商品创建默认值
      const newItems: ProductTableValue[] = [...existingValues]

      newIds.forEach((productId) => {
        if (!existingValues.some((v) => v.product_id === productId)) {
          const product = selectedProducts.find((p) => p.id === productId || p.value === productId)
          newItems.push({
            product_id: productId,
            quantity: 1,
            price: product?.purchase_price || product?.wholesale_price || 0
          })
        }
      })

      onChange(newItems)
    }
  )

  // 更新商品数量
  const handleQuantityChange = useMemoizedFn(
    (productId: number, quantity: number) => {
      if (!onChange) return

      const newValue = productTableValues.map((item) =>
        item.product_id === productId ? { ...item, quantity: quantity || 1 } : item
      )
      onChange(newValue)
    }
  )

  // 更新商品价格
  const handlePriceChange = useMemoizedFn(
    (productId: number, price: number) => {
      if (!onChange) return

      const newValue = productTableValues.map((item) =>
        item.product_id === productId ? { ...item, price: price || 0 } : item
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

  // 表格列定义
  const columns: ColumnsType<ProductItem> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
      render: (_, record) => record.name || record.label
    },
    {
      title: '编码',
      dataIndex: 'spu',
      key: 'spu',
      width: 90
    },
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 110
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 80
    },
    {
      title: '数量',
      key: 'quantity',
      width: 90,
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
            onChange={(val) => handleQuantityChange(record.id || record.value, val as number)}
            style={{ width: '100%' }}
          />
        )
      }
    },
    {
      title: '单价(¥)',
      key: 'price',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const item = productTableValues.find(
          (v) => v.product_id === record.id || v.product_id === record.value
        )
        return (
          <InputNumber
            min={0}
            size='small'
            step={0.01}
            value={item?.price || 0}
            onChange={(val) => handlePriceChange(record.id || record.value, val as number)}
            precision={2}
            style={{ width: '100%' }}
          />
        )
      }
    },
    {
      title: '小计(¥)',
      key: 'subtotal',
      width: 90,
      align: 'right',
      render: (_, record) => {
        const item = productTableValues.find(
          (v) => v.product_id === record.id || v.product_id === record.value
        )
        const subtotal = (item?.quantity || 0) * (item?.price || 0)
        return <span style={{ fontWeight: 500 }}>¥{subtotal.toFixed(2)}</span>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
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

  // 过滤掉已选择的选项
  const availableOptions = useMemo(() => {
    return options.filter((opt) => !selectedIds.includes(opt.value))
  }, [options, selectedIds])

  // 计算总金额
  const totalAmount = useMemo(() => {
    return productTableValues.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0)
  }, [productTableValues])

  return (
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
            scroll={{ x: 800 }}
          />
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
        </>
      )}
    </div>
  )
}

export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()
