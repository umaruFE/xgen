import React from 'react'
import { Item } from '@/components'

const Index = (props: any) => {
  return (
    <Item {...props.itemProps}>
      <div>ProductTableSelect works! (simple test)</div>
    </Item>
  )
}

export default Index
