import ReactToPrint from 'react-to-print'
import React, { useRef } from 'react'
import './style.scss'
import ReceiptOffline from 'pages/Screen/DashBoard/components/SaleScreen/components/ReceiptOffline'
import { Button } from 'antd'

const TagPrintBox = (props) => {
  let componentRef = useRef(null)
  const { data } = props

  const reactToPrintContent = React.useCallback(() => {
    return componentRef.current
  }, [componentRef.current])

  const reactToPrintTrigger = React.useCallback(() => {
    // NOTE: could just as easily return <SomeComponent />. Do NOT pass an `onClick` prop
    // to the root node of the returned component as it will be overwritten.

    // Bad: the `onClick` here will be overwritten by `react-to-print`
    // return <button onClick={() => alert('This will not work')}>Print this out!</button>;

    // Good
    return <Button style={{ width: '100%' }}>In Bill</Button>
  }, [])
 
  return (
    <div className='CodeBoxPinter'>
      <span>{data.code}</span>
      <ReactToPrint
        trigger={reactToPrintTrigger}
        removeAfterPrint
        content={reactToPrintContent}
      />
      <div style={{ display: 'none' }}>
        <ReceiptOffline data={data} ref={componentRef} />
      </div>
    </div>
  )
}

export default TagPrintBox
