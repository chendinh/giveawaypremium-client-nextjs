/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react'
import { withRouter } from 'next/router'
import { connect } from 'react-redux'
import GapService from 'controller/Api/Services/Gap'
import { Button, message } from 'antd'

const BillOrderGHTK = (props) => {
  const { orderId } = props
  const [base64, setBase64] = useState(null)
  const [orginal, setOriginal] = useState('portrait')
  const [pageSize, setPageSize] = useState('A6')

  useEffect(() => {
    fetcDefaultLabel()
  }, [])

  const fetcDefaultLabel = async (orginalProps = 'portrait', pageSizeProps = 'A6') => {
    const labelBas64 = await GapService.getLabelTransform(orderId, orginalProps || orginal, pageSizeProps || pageSize)
    console.log('labelBas64', labelBas64)
    // const img = dataURLToBlob(labelBas64.result)
    const base64String = `data:application/pdf;base64,${labelBas64}`
    // console.log('labelBas64', labelBas64)
    // const blob = base64toBlob(base64String)
    // const url = URL.createObjectURL(blob)
    if (labelBas64) {
      setBase64(labelBas64.result)
    }
  }

  const updateOriginal = () => {
    setOriginal(orginal === 'portrait' ? 'landscape' : 'portrait')
    setBase64(null)
    message.loading('Đang load lại')
    fetcDefaultLabel(orginal === 'portrait' ? 'landscape' : 'portrait', pageSize)
  }

  const updatePageSize = () => {
    setPageSize(pageSize === 'A6' ? 'A5' : 'A6')
    setBase64(null)
    message.loading('Đang load lại')
    fetcDefaultLabel(orginal, pageSize === 'A6' ? 'A5' : 'A6')
  }

  return (
    <div className='BillOrderGHTK-container'>
      <div style={{ textTransform: 'capitalize' }}>{orginal} - {pageSize}</div>
      <Button style={{ marginRight: '10px' }} onClick={updateOriginal}>{orginal === 'portrait' ? 'landscape' : 'portrait'}</Button>
      <Button onClick={updatePageSize}>{pageSize === 'A6' ? 'A5' : 'A6'}</Button>

      {
        base64 ? (
          <div className='MT40'>
            <object>
              <embed id='pdfID' type='text/html' width='100%' height='400' src={`data:application/pdf;base64,${base64}`} />
            </object>
          </div>
        ) : <p>Đang tải...</p>
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
  locale: state.locale,
  userData: state.userData
})

export default withRouter(connect(mapStateToProps, null)(BillOrderGHTK))
