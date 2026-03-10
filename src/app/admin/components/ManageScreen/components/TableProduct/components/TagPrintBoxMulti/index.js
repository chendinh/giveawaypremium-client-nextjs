import ReactToPrint from 'react-to-print'
import React, { useRef } from 'react'
import { PrintOutlined } from '@material-ui/icons'
import TagOrcode from '../TagQrcode'
import './style.scss'
import styled from 'styled-components'

const TagPrintBoxMulti = (props) => {
  let componentRef = useRef(null)
  const { data, productData } = props

  const reactToPrintContent = React.useCallback(() => {
    return componentRef.current
  }, [componentRef.current])

  const reactToPrintTrigger = React.useCallback(() => {
    // NOTE: could just as easily return <SomeComponent />. Do NOT pass an `onClick` prop
    // to the root node of the returned component as it will be overwritten.

    // Bad: the `onClick` here will be overwritten by `react-to-print`
    // return <button onClick={() => alert('This will not work')}>Print this out!</button>;

    // Good
    return <span className='createNewButton' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid black', padding: 8, borderRadius: 50 }}><PrintOutlined className='MR10' style={{ fontSize: 25 }} /> In Ngay</span>
  }, [])

  const PageBreakWrapper = styled.div`
  && {
    page-break-after: always;
  }
`

  const PrintTemplate = ({ index, detail }) => {
    return (
      <div style={{ display: 'inline-block', width: '34mm !important', margin: 0, marginLeft: 2.5 }}>
        <TagOrcode data={detail} />
        {/* {(index % 2) ? <PageBreakWrapper>&nbsp;</PageBreakWrapper> : null} */}
      </div>
    // </div>
    )
  }

  let productDataTemp = []
  // let printingPages = []
  let indexItemStart = 0
  let indexLoop = 0

  for (const detail of productData) {
    // console.log('detail', detail)
    // console.log(detail)
    // const tempTemplate = <PrintTemplate index={index} detail={detail} />
    for (let i = 0; i < detail.numberTagCount; i++) {
      // indexItemStart += 1
      productDataTemp.push(detail)
      // printingPages.push(tempTemplate)
    }
    indexLoop += 1
  }

  return (
    <div className='CodeBoxPinterMulti'>
      {/* <div className='boxTwoTag' ref={componentRef}>{printingPages}</div> */}
      <ReactToPrint
        trigger={reactToPrintTrigger}
        removeAfterPrint
        content={reactToPrintContent}
      />
      <div className='boxTwoTag' ref={componentRef}>{productData && productDataTemp && productDataTemp.map((item, indexItem) => {
        return (
          <PrintTemplate key={indexItem} index={indexItem} detail={item} />
        )
      })}</div>

      <ReactToPrint
        trigger={reactToPrintTrigger}
        removeAfterPrint
        content={reactToPrintContent}
      />
      {/* <div style={{ display: 'none' }}> */}
      {/* <TagOrcode data={data} ref={componentRef} /> */}
      {/* </div> */}
    </div>
  )
}

export default TagPrintBoxMulti
