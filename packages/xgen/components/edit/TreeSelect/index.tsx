import { TreeSelect } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useLayoutEffect, useState,useMemo } from 'react'
import { container } from 'tsyringe'

import { Item } from '@/components'

import styles from './index.less'
import Model from './model'

import type { TreeSelectProps } from 'antd'
import type { Component } from '@/types'

interface IProps extends TreeSelectProps,Component.PropsEditComponent {}
interface CustomProps extends TreeSelectProps {}

const Custom = window.$app.memo((props: CustomProps) => {    
    return  <TreeSelect
				{...props}
				placeholder={props.placeholder }>
            </TreeSelect> 
})

const Index = (props: IProps) => {
	const { __bind, __name, itemProps, ...rest_props } = props
    
    const [x] = useState(() => container.resolve(Model))

    useLayoutEffect(() => {
        x.remote.raw_props = props
        x.remote.init()
    }, [props])

    
	return (
        <Item className={styles._local} {...itemProps} {...{ __bind, __name }}>
                    {/* @ts-ignore */}
                    <Custom  checkable {...rest_props} treeData={x.options} ></Custom>
        </Item>
	)
}
export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()
