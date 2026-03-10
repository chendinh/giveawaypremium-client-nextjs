/* eslint-disable react/display-name */
import React, { useContext, useState, useEffect, useRef } from 'react'
import router, { withRouter } from 'next/router'
import { connect } from 'react-redux'
import {
  Form, Row, Col, Layout, Input, Button, Spin, Divider, List, Card, InputNumber,
  Descriptions, Tabs, Table, Switch, Steps, Popover, Checkbox, Empty, Cascader, message
} from 'antd'
import { images } from 'config/images'
import MyModal from 'pages/Components/MyModal'
import { base64toBlob, dataURLToBlob, numberWithCommas, showNotification } from 'common/function'
import { CheckCircleFilled, CloseCircleFilled, CloseCircleOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined, LoadingOutlined, QrcodeOutlined, SettingOutlined } from '@ant-design/icons'
import { Router } from 'common/routes'
import { isMobile } from 'react-device-detect'
import './style.scss'
import Lottie from 'react-lottie'
import GapService from 'controller/Api/Services/Gap'
import { AssignmentReturnedSharp, Scanner, ScannerOutlined } from '@material-ui/icons'
import { colors } from '@material-ui/core'
import { ADDRESS_GET_ORDER_ARRAY, ADDRESS_STREET_GET_ORDER } from 'common/constants'
import ReceiptOffline from './components/ReceiptOffline'
import ReactToPrint from 'react-to-print'
import QRCode from 'qrcode'

const { Step } = Steps
const { TextArea } = Input

const { TabPane } = Tabs

const initialPanes = []
let numPaneTemp = 0

const SaleScreen = (props) => {
  let componentRef = useRef(null)
  const onBeforeGetContentResolve = React.useRef(null)

  const [svg, setSvg] = useState('')

  const { userData, addressInfoArrayRedux } = props
  const [panes, setPanes] = useState(initialPanes)
  const [currentPaneIndex, setCurrentPaneIndex] = useState(numPaneTemp)
  const [activeKey, setActiveKey] = useState(null)
  const [optionsAddressArr, setOptionsAddressArr] = useState([])
  const [base64, setBase64] = useState(null)
  let searchInput

  useEffect(() => {
    // fetcDefaultLabel()
    convertAddressOptionArray()
    console.log('addressInfoArrayRedux', addressInfoArrayRedux)
    add()
    return () => {
      numPaneTemp = 0
    }
  }, [])

  async function formatQRCodeImage (data) {
    let result = ''
    const dataString = await QRCode.toString(data, { margin: 0, type: 'svg', width: 65, height: 22 })
    if (typeof dataString === 'string') {
      result = dataString.replace('<svg', `<svg class="walletconnect-qrcode__image"`)
    }
    return result
  }

  useEffect(() => {
    (async () => {
      setSvg(await formatQRCodeImage('231-123123-001'))
    })()
  })

  useEffect(() => {
    console.log('useEffect - panes - ', panes)
    setCurrentPaneIndex(currentPaneIndex)
  }, [panes])

  const fetcDefaultLabel = async () => {
    const labelBas64 = await GapService.getLabelTransform()
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

  /// ////////////////////////////////////////////////// Tabs - TabPane -- START /////////////////////////////////////////////////////
  const onChangeTab = (newActiveKey) => {
    console.log('onChangeTab', newActiveKey)
    let currenIndexName = 0
    let activeKey
    panes.map((item, index) => {
      if (Number(item.key) === Number(newActiveKey)) {
        currenIndexName = index
        activeKey = Number(item.key)
      }
    })
    searchInput && searchInput.focus()
    setCurrentPaneIndex(currenIndexName)
    setActiveKey(activeKey)
    console.log('panes', panes)
  }

  const add = () => {
    console.log('add')
    const newIndex = numPaneTemp
    numPaneTemp += 1
    const newActiveKey = newIndex
    const newPanes = [...panes]
    newPanes.push({
      isOnlineSale: 'false',
      title: `Đơn hàng ${newIndex}`,
      key: newActiveKey,
      clientInfo: {
        objectId: '',
        fullName: '',
        phoneNumber: '',
        birthday: '',
        bankName: '',
        bankId: '',
        consignerIdCard: '',
        mail: ''
      },
      shippingInfo: {
        optionTransfer: 'tk'
      },
      isTransferWithBank: 'false',
      isTransferWithBankAndOffline: 'false',
      productList: [
        // { amount: 1, name: ao da tron, code: ma-322-001}
      ],
      inputText: '',
      currentTag: 1,
      shippingAddress: '',
      isLoadingUser: false,
      isFoundUser: false,
      totalNumberOfProductForSale: 0,
      totalMoneyForSale: 0,
      transferBankMoneyAmount: null,
      transferOfflineMoneyAmount: null
    })

    let currenIndexName = 0
    let activeKey
    newPanes.map((item, index) => {
      if (Number(item.key) === Number(newActiveKey)) {
        currenIndexName = index
        activeKey = Number(item.key)
      }
    })
    searchInput && searchInput.focus()
    setCurrentPaneIndex(currenIndexName)
    setActiveKey(activeKey)
    setPanes(newPanes)
  }

  const resetData = () => {
    const paneTemp = [...panes]
    paneTemp[currentPaneIndex] = {
      ...paneTemp[currentPaneIndex],
      isOnlineSale: 'false',
      clientInfo: {
        objectId: '',
        fullName: '',
        phoneNumber: '',
        birthday: '',
        bankName: '',
        bankId: '',
        consignerIdCard: '',
        mail: ''
      },
      shippingInfo: {
        optionTransfer: 'tk'
      },
      isTransferWithBank: 'false',
      isTransferWithBankAndOffline: 'false',
      productList: [
        // { amount: 1, name: ao da tron, code: ma-322-001}
      ],
      inputText: '',
      currentTag: 1,
      shippingAddress: '',
      isLoadingUser: false,
      isFoundUser: false,
      isCreatedSuccessfully: false,
      totalNumberOfProductForSale: 0,
      totalMoneyForSale: 0,
      transferBankMoneyAmount: null,
      transferOfflineMoneyAmount: null
    }

    setPanes(paneTemp)
  }

  const remove = (targetKey) => {
    let deleteIndexAt = 0
    let newCurrentIndex = currentPaneIndex

    const newPanes = panes.filter((pane, paneIndex) => {
      if (Number(pane.key) === Number(targetKey)) {
        deleteIndexAt = paneIndex
      }
      return Number(pane.key) !== Number(targetKey)
    })
    setPanes(newPanes)

    setTimeout(() => {
      if (deleteIndexAt < newCurrentIndex) {
        newCurrentIndex = newCurrentIndex === 0 ? 0 : newCurrentIndex - 1
        setCurrentPaneIndex(newCurrentIndex)
      } else if (deleteIndexAt === newCurrentIndex) {
        newCurrentIndex = newCurrentIndex === 0 ? 0 : newCurrentIndex - 1
        setCurrentPaneIndex(newCurrentIndex)
      } else if (deleteIndexAt > newCurrentIndex) {
        setCurrentPaneIndex(newCurrentIndex)
      }
    }, 100)
  }

  // action = 'add' | 'remove'
  const onEdit = (targetKey, action) => {
    // console.log('onEdit')
    if (action === 'add') {
      add()
    } else {
      remove(targetKey)
    }
  }

  /// ////////////////////////////////////////////////// Tabs - TabPane -- END /////////////////////////////////////////////////////

  /// ////////////////////////////////////////////////// Steps - Step -- START /////////////////////////////////////////////////////
  const customDot = (dot, { status, index }) => (
    <Popover
      content={
        <span>
        step {index} status: {status}
        </span>
      }
    >
      {dot}
    </Popover>
  )

  const onChangeStep = (stepValue, indexPane) => {
    // console.log('stepValue', stepValue)
    // console.log(indexPane)
    // set
  }
  /// ////////////////////////////////////////////////// Tabs - TabPane -- END /////////////////////////////////////////////////////

  const barcodeAutoFocus = () => {
    // if ()
    // document.getElementById('SearchbyScanning').focus()
  }

  const optionsTypeOnlineSale = [
    { label: 'Offline', value: 'false' },
    { label: 'Online', value: 'true' }
  ]

  const optionsTransferMoneyWithBank = [
    { label: 'Trực tiếp', value: 'false', disabled: true },
    { label: 'Chuyển khoản', value: 'true' }
  ]

  const optionsTransferMoney = [
    { label: 'Trực tiếp', value: 'false' },
    { label: 'Chuyển khoản', value: 'true' },
    { label: 'Cả hai', value: 'both' }
  ]

  const optionsTransferOrder = [
    { label: 'Giao hàng tiết kiệm', value: 'tk' },
    { label: 'Hoả tốc', value: 'ht' },
    { label: 'Lấy hàng trực tiếp', value: 'tt' }
  ]

  const onChangeRadioTransferMoney = (value) => {
    const paneTemp = [...panes]
    if (value[0] === 'true') {
      paneTemp[currentPaneIndex].isTransferWithBank = 'true'
      paneTemp[currentPaneIndex].isTransferWithBankAndOffline = 'false'
      setPanes(paneTemp)
    } else if (value[0] === 'both') {
      paneTemp[currentPaneIndex].isTransferWithBank = 'false'
      paneTemp[currentPaneIndex].isTransferWithBankAndOffline = 'true'
      setPanes(paneTemp)
    } else {
      paneTemp[currentPaneIndex].isTransferWithBank = 'false'
      paneTemp[currentPaneIndex].isTransferWithBankAndOffline = 'false'
      setPanes(paneTemp)
    }
  }

  const onChangeRadioTransferOrder = async (value) => {
    const paneTemp = [...panes]
    console.log('value[0]', value[0])
    switch (value[0]) {
    case 'tk':
    {
      if (paneTemp[currentPaneIndex].shippingInfo.optionTransfer === 'tk') {
        return
      }
      paneTemp[currentPaneIndex].shippingInfo.optionTransfer = 'tk'
      if (paneTemp[currentPaneIndex].shippingInfo.orderAdressProvince) {
        message.loading('Đang lấy thông tin phí shipping...', 2)
        const formDataFee = {
          orderAdressProvince: paneTemp[currentPaneIndex].shippingInfo.orderAdressProvince,
          orderAdressDistrict: paneTemp[currentPaneIndex].shippingInfo.orderAdressDistrict,
          orderAdressWard: paneTemp[currentPaneIndex].shippingInfo.orderAdressWard
        }
        const resFee = await GapService.getFeeForTransport(formDataFee, paneTemp?.[currentPaneIndex]?.shippingInfo?.optionTransfer === 'ht')
        console.log('resFee.result', resFee.result)
        if (resFee && resFee.result) {
          paneTemp[currentPaneIndex].shippingInfo.shippingFee = resFee.result
          setPanes(paneTemp)
          return
        } else {
          showNotification('Không thể ước tính phí hiện tại')
          setPanes(paneTemp)
          return
        }
      } else {
        setPanes(paneTemp)
        return
      }
    }

    case 'ht': {
      if (paneTemp[currentPaneIndex].shippingInfo.optionTransfer === 'ht') {
        return
      }
      paneTemp[currentPaneIndex].shippingInfo.optionTransfer = 'ht'
      if (paneTemp[currentPaneIndex].shippingInfo.orderAdressProvince) {
        message.loading('Đang lấy thông tin phí shipping...', 2)
        const formDataFee = {
          orderAdressProvince: paneTemp[currentPaneIndex].shippingInfo.orderAdressProvince,
          orderAdressDistrict: paneTemp[currentPaneIndex].shippingInfo.orderAdressDistrict,
          orderAdressWard: paneTemp[currentPaneIndex].shippingInfo.orderAdressWard
        }
        const resFee = await GapService.getFeeForTransport(formDataFee, paneTemp?.[currentPaneIndex]?.shippingInfo?.optionTransfer === 'ht')
        if (resFee && resFee.result) {
          paneTemp[currentPaneIndex].shippingInfo.shippingFee = resFee.result
          setPanes(paneTemp)
          return
        } else {
          showNotification('Không thể ước tính phí hiện tại')
          setPanes(paneTemp)
          return
        }
      } else {
        setPanes(paneTemp)
        return
      }
    }
    case 'tt': {
      if (paneTemp[currentPaneIndex].shippingInfo.optionTransfer === 'tt') {
        return
      }
      paneTemp[currentPaneIndex].shippingInfo.optionTransfer = 'tt'
      paneTemp[currentPaneIndex].shippingInfo.shippingFee = 0
      setPanes(paneTemp)
    }
    }
  }

  const onChangeRadioTypeOnlineSale = (value) => {
    const paneTemp = [...panes]
    if (value[0] === 'true') {
      paneTemp[currentPaneIndex].isOnlineSale = 'true'
      paneTemp[currentPaneIndex].isTransferWithBank = 'true'
      setPanes(paneTemp)
    } else {
      paneTemp[currentPaneIndex].isOnlineSale = 'false'
      setPanes(paneTemp)
    }

    searchInput && searchInput.focus()
  }

  const onHanleChangeTextNote = (value) => {
    const paneTemp = [...panes]
    paneTemp[currentPaneIndex].note = value.target.value
    setPanes(paneTemp)
  }

  const onHandleEnterAndCheckIdProduct = async (value) => {
    if (!value || value === '' || !value.target.value) {
      showNotification('Chưa có dữ liệu')
      return
    }

    message.loading('Đang tìm kiếm thông tin sản phẩm')

    // const productRes = await GapService.getProductWithObjectKey('hCDoylb0Z4')
    const productResArr = await GapService.getProductWithCode(value.target.value.trim())
    message.destroy()
    if (productResArr?.results?.[0] && productResArr?.results?.[0].objectId) {
      const paneTemp = [...panes]
      let isExistProduct = false
      if (productResArr?.results?.[0].remainNumberProduct !== undefined && (Number(productResArr?.results[0]?.remainNumberProduct) === 0)) {
        showNotification('Sản phẩm này đã hết hàng')
        paneTemp[currentPaneIndex].inputText = ''
        setPanes(paneTemp)
        return
      }

      let existProductIndex
      paneTemp[currentPaneIndex].productList.map((item, itemIndex) => {
        if (item.objectId === productResArr?.results?.[0].objectId) {
          isExistProduct = true
          existProductIndex = itemIndex
        }
      })
      let productRes = productResArr?.results?.[0]

      if (isExistProduct && existProductIndex >= 0) {
        showNotification('Sản phẩm tương đồng')

        paneTemp[currentPaneIndex].inputText = ''

        if ((paneTemp[currentPaneIndex].productList[existProductIndex].numberOfProductForSale || 1) + 1 > paneTemp[currentPaneIndex].productList[existProductIndex].remainNumberProduct) {
          showNotification(`Số lượng tối đa là ${paneTemp[currentPaneIndex].productList[existProductIndex].remainNumberProduct}`)
          return
        }
        paneTemp[currentPaneIndex].productList[existProductIndex].numberOfProductForSale = (!paneTemp[currentPaneIndex].productList[existProductIndex].numberOfProductForSale || paneTemp[currentPaneIndex].productList[existProductIndex].numberOfProductForSale === 1) ? 2 : paneTemp[currentPaneIndex].productList[existProductIndex].numberOfProductForSale + 1

        paneTemp[currentPaneIndex].totalNumberOfProductForSale = (paneTemp[currentPaneIndex].totalNumberOfProductForSale || 0) + 1
        paneTemp[currentPaneIndex].totalMoneyForSale = (paneTemp[currentPaneIndex].totalMoneyForSale || 0) + productRes.price
        paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee = (paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee || 0) + productRes.priceAfterFee
        // let totalNumberOfProductForSale = 0
        // let totalMoneyForSale = 0
        // let totalMoneyForSaleAfterFee = 0
        // paneTemp[currentPaneIndex].productList.map(item => {
        //   totalNumberOfProductForSale += item.numberOfProductForSale || 1
        //   totalMoneyForSale += (item.numberOfProductForSale || 1) * item.price
        //   totalMoneyForSaleAfterFee += (item.numberOfProductForSale || 1) * item.priceAfterFee
        // })
        // paneTemp[currentPaneIndex].totalNumberOfProductForSale = totalNumberOfProductForSale
        // paneTemp[currentPaneIndex].totalMoneyForSale = totalMoneyForSale
        // paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee = totalMoneyForSaleAfterFee
        setPanes(paneTemp)

        // onChangeProductItem(paneTemp[currentPaneIndex].productList[existProductIndex].numberOfProductForSale + 1, 'productNumber', existProductIndex)

        // paneTemp[currentPaneIndex].totalNumberOfProductForSale = (paneTemp[currentPaneIndex].totalNumberOfProductForSale || 0) + 1
        // paneTemp[currentPaneIndex].totalMoneyForSale = (paneTemp[currentPaneIndex].totalMoneyForSale || 0) + productRes.price
        // paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee = (paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee || 0) + productRes.priceAfterFee
        // setPanes(paneTemp)
        return
      }

      // <InputNumber min={1} max={item.remainNumberProduct || 1} defaultValue={1} value={item.numberOfProductForSale || 1} onChange={(value) => onChangeProductItem(value, 'productNumber', itemIndex)} />

      paneTemp[currentPaneIndex].productList = [...paneTemp[currentPaneIndex].productList, productRes]
      paneTemp[currentPaneIndex].inputText = ''
      paneTemp[currentPaneIndex].totalNumberOfProductForSale = (paneTemp[currentPaneIndex].totalNumberOfProductForSale || 0) + 1
      paneTemp[currentPaneIndex].totalMoneyForSale = (paneTemp[currentPaneIndex].totalMoneyForSale || 0) + productRes.price
      paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee = (paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee || 0) + productRes.priceAfterFee
      setPanes(paneTemp)
    } else {
      showNotification('Sản phẩm không tồn tại')
    }
  }

  const onChangeTextProductInput = (event) => {
    console.log('onChangeTextProductInput')
    const paneTemp = [...panes]
    paneTemp[currentPaneIndex].inputText = event.target.value
    setPanes(paneTemp)
  }
  const onKeyPressBarcode = (event) => {
    console.log('onKeyPressBarcode')

    if (event.keyCode === 13) {
      console.log('onKeyPressBarcode 13')

      const paneTemp = [...panes]
      paneTemp[currentPaneIndex].inputText = event.target.value
      setPanes(paneTemp)
    }
  }

  const onDeleteProductItem = (itemIndex) => {
    const paneTemp = [...panes]
    paneTemp[currentPaneIndex].productList = paneTemp[currentPaneIndex].productList.filter((item, index) => itemIndex !== index)
    let totalNumberOfProductForSale = 0
    let totalMoneyForSale = 0
    let totalMoneyForSaleAfterFee = 0
    paneTemp[currentPaneIndex].productList.map(item => {
      totalNumberOfProductForSale += item.numberOfProductForSale || 1
      totalMoneyForSale += (item.numberOfProductForSale || 1) * item.price
      totalMoneyForSaleAfterFee += (item.numberOfProductForSale || 1) * item.priceAfterFee
    })
    paneTemp[currentPaneIndex].totalNumberOfProductForSale = totalNumberOfProductForSale
    paneTemp[currentPaneIndex].totalMoneyForSale = totalMoneyForSale
    paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee = totalMoneyForSaleAfterFee
    setPanes(paneTemp)
  }

  const onChangeProductItem = (value, type, itemIndex) => {
    const paneTemp = [...panes]
    if (type === 'productNumber') {
      if (value > paneTemp[currentPaneIndex].productList[itemIndex].remainNumberProduct) {
        showNotification(`Số lượng tối đa là ${paneTemp[currentPaneIndex].productList[itemIndex].remainNumberProduct}`)
        return
      }
      paneTemp[currentPaneIndex].productList[itemIndex].numberOfProductForSale = value
      let totalNumberOfProductForSale = 0
      let totalMoneyForSale = 0
      let totalMoneyForSaleAfterFee = 0
      paneTemp[currentPaneIndex].productList.map(item => {
        totalNumberOfProductForSale += item.numberOfProductForSale || 1
        totalMoneyForSale += (item.numberOfProductForSale || 1) * item.price
        totalMoneyForSaleAfterFee += (item.numberOfProductForSale || 1) * item.priceAfterFee
      })
      paneTemp[currentPaneIndex].totalNumberOfProductForSale = totalNumberOfProductForSale
      paneTemp[currentPaneIndex].totalMoneyForSale = totalMoneyForSale
      paneTemp[currentPaneIndex].totalMoneyForSaleAfterFee = totalMoneyForSaleAfterFee
      setPanes(paneTemp)
    }
  }

  const reactToPrintContent = React.useCallback(() => {
    return componentRef.current
  }, [componentRef.current])

  const reactToPrintTrigger = React.useCallback(() => {
    // NOTE: could just as easily return <SomeComponent />. Do NOT pass an `onClick` prop
    // to the root node of the returned component as it will be overwritten.

    // Bad: the `onClick` here will be overwritten by `react-to-print`
    // return <button onClick={() => alert('This will not work')}>Print this out!</button>;

    // Good
    return <button className='createNewButton'>In hoá đơn</button>
  }, [])

  const printWithId = (idDom) => {
    var printContents = document.getElementById(idDom).innerHTML
    // var originalContents = document.body.innerHTML

    // document.body.innerHTML = printContents
    // var newWindow = window.open('redir2.html')
    // newWindow.focus()
    // newWindow.print()
    // newWindow.close()

    var win = window.open('', 'PrintWindow')

    win.document.write(`<html><head><title>' + title + '</title><link type="text/css" href="./components/ReceiptOffline/styles.css"></head><body>`)
    win.document.write(printContents)
    win.document.write('</body></html>')
    // win.document.writeln(printContents)

    var beforePrint = function () {
      console.log('Functionality to run before printing.')
    }
    var afterPrint = function () {
      // router.reload()
      console.log('Functionality to run after printing')
    }

    if (window.matchMedia) {
      var mediaQueryList = window.matchMedia('print')
      mediaQueryList.addListener(function (mql) {
        if (mql.matches) {
          beforePrint()
        } else {
          afterPrint()
        }
      })
    }

    setTimeout(function () {
      win.document.close()
      win.focus()
      win.print()
      win.close()
    }, 1000)

    // win.onbeforeprint = beforePrint
    // win.onafterprint = afterPrint
    // win.print()

    // document.body.innerHTML = originalContents
  }

  const onHandleCreateOrder = async () => {
    let isError = false
    const paneTemp = [...panes]

    if (!paneTemp[currentPaneIndex].clientInfo.phoneNumber || paneTemp[currentPaneIndex]?.clientInfo?.phoneNumber.length <= 9) {
      isError = true
      showNotification(`Chưa nhập số điện thoại`)
    } else if (!paneTemp[currentPaneIndex].productList || paneTemp[currentPaneIndex]?.productList?.length === 0) {
      isError = true
      showNotification(`Chưa có sản phẩm nào`)
    } else if (paneTemp[currentPaneIndex].isOnlineSale === 'true' && (!paneTemp[currentPaneIndex].clientInfo || !paneTemp[currentPaneIndex].clientInfo.fullName)) {
      isError = true
      showNotification(`Chưa nhập tên Khách hàng`)
    } else if (paneTemp[currentPaneIndex].isOnlineSale === 'true' && paneTemp[currentPaneIndex].shippingInfo && (!paneTemp[currentPaneIndex].shippingInfo?.orderAdressStreet || paneTemp[currentPaneIndex].shippingInfo?.orderAdressStreet.length === 0)) {
      isError = true
      showNotification(`Vui nhập thêm thông tin số nhà/tên đường nha`)
    } else if (paneTemp[currentPaneIndex].isOnlineSale === 'true' && paneTemp[currentPaneIndex].shippingInfo && (!paneTemp[currentPaneIndex].shippingInfo.orderAdressWard || !paneTemp[currentPaneIndex].shippingInfo.orderAdressDistrict || !paneTemp[currentPaneIndex].shippingInfo.orderAdressProvince)) {
      isError = true
      showNotification(`Vui nhập thông tin: xã.phường / quận.huyện / tỉnh.thành phố`)
    }

    if (isError) {
      // do not thing
      return null
    }
    message.loading('Đang xử lý thông tin đơn hàng')

    const dataOrder = {
      ...paneTemp[currentPaneIndex]
    }

    paneTemp[currentPaneIndex].productList.map((item, itemIndex) => {
      paneTemp[currentPaneIndex].productList[itemIndex].count = paneTemp[currentPaneIndex]?.productList[itemIndex]?.numberOfProductForSale || 1
    })

    const resUSer = await GapService.getCustomer(paneTemp[currentPaneIndex].clientInfo.phoneNumber)
    if (resUSer && resUSer.results && resUSer.results[0]) { // for already user
      const customerFormData = {
        consignerName: paneTemp[currentPaneIndex].clientInfo.fullName,
        phoneNumber: paneTemp[currentPaneIndex].clientInfo.phoneNumber,
        consignerIdCard: paneTemp[currentPaneIndex].clientInfo.consignerIdCard,
        mail: paneTemp[currentPaneIndex].clientInfo.mail,
        birthday: paneTemp[currentPaneIndex].clientInfo.birthday && paneTemp[currentPaneIndex].clientInfo.birthday.length > 0 && paneTemp[currentPaneIndex].clientInfo.birthday !== 'Invalid date' ? paneTemp[currentPaneIndex].clientInfo.birthday : '',
        bankName: paneTemp[currentPaneIndex].clientInfo.bankName,
        bankId: paneTemp[currentPaneIndex].clientInfo.bankId,
        totalMoneyForSale: resUSer.results[0].totalMoneyForSale ? Number(resUSer.results[0].totalMoneyForSale || 0) + Number(dataOrder.totalMoneyForSale || 0) : Number(dataOrder.totalMoneyForSale || 0),
        numberOfSale: resUSer.results[0].numberOfSale ? Number(resUSer.results[0].numberOfSale || 0) + 1 : 1,
        totalProductForSale: resUSer.results[0].totalProductForSale ? Number(resUSer.results[0].totalProductForSale || 0) + Number(dataOrder.totalNumberOfProductForSale || 0) : Number(dataOrder.totalNumberOfProductForSale || 0)
      }
      message.destroy()
      message.loading('Đang cập nhật thông tin khách hàng')
      const resCustomer = await GapService.updateCustomer(customerFormData, resUSer.results[0].objectId)
      if (resCustomer && resCustomer.updatedAt) {
        showNotification('Cập nhật khách hàng thành công')
        const result = await GapService.setOrder(dataOrder, userData.objectId, resUSer.results[0].objectId)

        if (result && result.objectId) {
          paneTemp[currentPaneIndex].objectIdOrder = result.objectId
          showNotification('Tạo Đơn hàng thành công')
          paneTemp[currentPaneIndex].isCreatedSuccessfully = true
          setPanes(paneTemp)
        } else {
          showNotification('Tạo Đơn hàng thất bại')
        }
      } else {
        showNotification('Cập nhật khách hàng thất bại')
      }
    } else {
      const customerFormData = {
        consignerName: paneTemp[currentPaneIndex].clientInfo.fullName,
        phoneNumber: paneTemp[currentPaneIndex].clientInfo.phoneNumber,
        consignerIdCard: paneTemp[currentPaneIndex].clientInfo.consignerIdCard,
        mail: paneTemp[currentPaneIndex].clientInfo.mail || 'example@gmail.com',
        birthday: paneTemp[currentPaneIndex].clientInfo.birthday && paneTemp[currentPaneIndex].clientInfo.birthday.length > 0 && paneTemp[currentPaneIndex].clientInfo.birthday !== 'Invalid date' ? paneTemp[currentPaneIndex].clientInfo.birthday : '',
        bankName: paneTemp[currentPaneIndex].clientInfo.bankName,
        bankId: paneTemp[currentPaneIndex].clientInfo.bankId,

        username: paneTemp[currentPaneIndex].clientInfo.phoneNumber,
        password: paneTemp[currentPaneIndex].clientInfo.phoneNumber
      }
      message.destroy()
      message.loading('Đang lưu thông tin khách hàng')

      const resCus = await GapService.setCustomer(customerFormData)
      if (resCus && resCus.objectId) {
        showNotification('Thêm khách hàng thành công')
        const result = await GapService.setOrder(dataOrder, userData.objectId, resCus.objectId)
        message.destroy()
        if (result && result.objectId) {
          showNotification('Tạo Đơn hàng thành công')
          paneTemp[currentPaneIndex].isCreatedSuccessfully = true
          setPanes(paneTemp)
        } else {
          showNotification('Tạo Đơn hàng thất bại')
        }
      } else {
        message.destroy()
        showNotification('Tạo khách hàng thất bại')
      }
      //
    }
  }

  const fetchUserByPhoneNumber = async (phoneKey) => {
    const valueInput = phoneKey?.target?.value || ''
    if (phoneKey && phoneKey.target && phoneKey.target.value && phoneKey.target.value.length >= 10) {
      const paneTemp = [...panes]
      message.loading('Đang lấy thông tin khách hàng...', 3)

      const res = await GapService.getCustomer(phoneKey.target.value)
      message.destroy()
      if (res && res.results && res.results[0]) {
        message.success('Thông tin khách hàng đã tồn tại', 2)
        console.log('fetchUserByPhoneNumber set form', res.results[0])
        paneTemp[currentPaneIndex].isLoadingUser = false
        paneTemp[currentPaneIndex].isFoundUser = true
        paneTemp[currentPaneIndex].clientInfo = {
          fullName: res.results[0].fullName,
          phoneNumber: res.results[0].phoneNumber,
          bankName: res.results[0].banks[0] ? res.results[0].banks[0].type : '',
          bankId: res.results[0].banks[0] ? res.results[0].banks[0].accNumber : '',
          consignerIdCard: res.results[0].identityNumber,
          birthday: res.results[0].birthday,
          mail: res.results[0].mail,
          objectId: res.results[0].objectId
        }
        console.log('paneTemp', paneTemp)
        setPanes(paneTemp)
      } else {
        message.error('Thông tin khách hàng chưa tồn tại', 2)
        paneTemp[currentPaneIndex].isLoadingUser = false
        paneTemp[currentPaneIndex].isFoundUser = false
        paneTemp[currentPaneIndex].clientInfo = {
          objectId: '',
          fullName: '',
          phoneNumber: valueInput,
          birthday: '',
          bankName: '',
          bankId: '',
          consignerIdCard: '',
          mail: ''
        }
        setPanes(paneTemp)
      }
    } else if (phoneKey && phoneKey.target && phoneKey.target.value && phoneKey.target.value.length < 10) {
      console.log('fetchUserByPhoneNumber == 0')
      const paneTemp = [...panes]
      paneTemp[currentPaneIndex].isLoadingUser = false
      paneTemp[currentPaneIndex].isFoundUser = false
      paneTemp[currentPaneIndex].clientInfo = {
        objectId: '',
        fullName: '',
        phoneNumber: phoneKey.target.value,
        birthday: '',
        bankName: '',
        bankId: '',
        consignerIdCard: '',
        mail: ''
      }
      setPanes(paneTemp)
    } else {
      console.log('fetchUserByPhoneNumber dont run 2')
      const paneTemp = [...panes]
      paneTemp[currentPaneIndex].isLoadingUser = false
      paneTemp[currentPaneIndex].isFoundUser = false
      paneTemp[currentPaneIndex].clientInfo = {
        objectId: '',
        fullName: '',
        phoneNumber: phoneKey.target.value,
        birthday: '',
        bankName: '',
        bankId: '',
        consignerIdCard: '',
        mail: ''
      }
      setPanes(paneTemp)
    }
  }

  const onChangeDataClient = (event, keyValue) => {
    const paneTemp = [...panes]

    if (keyValue === 'bankName') {
      paneTemp[currentPaneIndex].clientInfo = {
        ...paneTemp[currentPaneIndex].clientInfo,
        bankName: event.target.value ? event.target.value.trim() : ''
      }
      setPanes(paneTemp)
    } else if (keyValue === 'bankId') {
      paneTemp[currentPaneIndex].clientInfo = {
        ...paneTemp[currentPaneIndex].clientInfo,
        bankId: event.target.value ? event.target.value.trim() : ''
      }
      setPanes(paneTemp)
    } else if (keyValue === 'fullName') {
      paneTemp[currentPaneIndex].clientInfo = {
        ...paneTemp[currentPaneIndex].clientInfo,
        fullName: event.target.value ? event.target.value.trim() : ''
      }
      setPanes(paneTemp)
    } else if (keyValue === 'birthday') {
      paneTemp[currentPaneIndex].clientInfo = {
        ...paneTemp[currentPaneIndex].clientInfo,
        birthday: event.target.value ? event.target.value.trim() : ''
      }
      setPanes(paneTemp)
    } else if (keyValue === 'consignerIdCard') {
      paneTemp[currentPaneIndex].clientInfo = {
        ...paneTemp[currentPaneIndex].clientInfo,
        consignerIdCard: event.target.value ? event.target.value.trim() : ''
      }
      setPanes(paneTemp)
    } else if (keyValue === 'mail') {
      paneTemp[currentPaneIndex].clientInfo = {
        ...paneTemp[currentPaneIndex].clientInfo,
        mail: event.target.value ? event.target.value.trim() : ''
      }
      setPanes(paneTemp)
      // numberWithCommas((panes[currentPaneIndex].totalMoneyForSale || 0) * 1000)
    } else if (keyValue === 'transferOfflineMoneyAmount') {
      console.log('Number(keyValue)', Number(event.target.value.trim()))
      if (!(Number(event.target.value.trim()) >= 0)) {
        paneTemp[currentPaneIndex] = {
          ...paneTemp[currentPaneIndex],
          transferOfflineMoneyAmount: null,
          transferBankMoneyAmount: null
        }
        return
      }
      if (Number(event.target.value.trim()) > Number(paneTemp[currentPaneIndex].totalMoneyForSale)) {
        paneTemp[currentPaneIndex] = {
          ...paneTemp[currentPaneIndex],
          transferOfflineMoneyAmount: paneTemp[currentPaneIndex].totalMoneyForSale,
          transferBankMoneyAmount: 0
        }
      } else {
        paneTemp[currentPaneIndex] = {
          ...paneTemp[currentPaneIndex],
          transferOfflineMoneyAmount: event.target.value ? Number(event.target.value.trim()) : 0,
          transferBankMoneyAmount: (Number(paneTemp[currentPaneIndex].totalMoneyForSale) - Number(event.target.value.trim())) || 0
        }
      }
      setPanes(paneTemp)
    } else if (keyValue === 'transferBankMoneyAmount') {
      console.log('Number(keyValue)', Number(event.target.value.trim()))
      if (!(Number(event.target.value.trim()) >= 0)) {
        paneTemp[currentPaneIndex] = {
          ...paneTemp[currentPaneIndex],
          transferOfflineMoneyAmount: null,
          transferBankMoneyAmount: null
        }
        return
      }
      if (Number(event.target.value.trim()) > Number(paneTemp[currentPaneIndex].totalMoneyForSale)) {
        paneTemp[currentPaneIndex] = {
          ...paneTemp[currentPaneIndex],
          transferOfflineMoneyAmount: 0,
          transferBankMoneyAmount: paneTemp[currentPaneIndex].totalMoneyForSale
        }
      } else {
        paneTemp[currentPaneIndex] = {
          ...paneTemp[currentPaneIndex],
          transferOfflineMoneyAmount: (Number(paneTemp[currentPaneIndex].totalMoneyForSale) - Number(event.target.value.trim())) || 0,
          transferBankMoneyAmount: event.target.value ? Number(event.target.value.trim()) : 0
        }
      }
      setPanes(paneTemp)
    }
  }

  const onChangeDataShipping = (event, keyValue) => {
    const paneTemp = [...panes]

    if (keyValue === 'bankName') {
      paneTemp[currentPaneIndex].shippingAddress = {
        ...paneTemp[currentPaneIndex].clientInfo,
        bankName: event.target.value ? event.target.value.trim() : ''
      }
      setPanes(paneTemp)
    }
  }

  const convertAddressOptionArray = () => {
    // addressInfoArrayRedux
    let PROVINCE = []
    const addressInfoArrayReduxTemp = [...addressInfoArrayRedux]
    PROVINCE = addressInfoArrayReduxTemp.map((optionAddress, optionAddressIndex) => (
      {
        value: optionAddress.name,
        label: optionAddress.name,
        children: optionAddress.districts.map((districtItem, districtItemIndex) => (
          {
            value: districtItem.name,
            label: districtItem.name,
            children: districtItem.wards.map((wardItem, wardItemIndex) => (
              {
                value: wardItem.name,
                label: wardItem.name
              }
            ))
          }
        ))
      }
    ))
    // addressInfoArrayReduxTemp.map((optionAddress, optionAddressIndex) => {
    //   PROVINCE.push({
    //     value: optionAddress.name,
    //     label: optionAddress.name,
    //     children: [optionAddress.districts.map((districtItem, districtItemIndex) => {
    //       return {
    //         value: districtItem.name,
    //         label: districtItem.name,
    //         children: [districtItem.wards.map((wardItem, wardItemIndex) => {
    //           return {
    //             value: wardItem.name,
    //             label: wardItem.name
    //           }
    //         })]
    //       }
    //     })]
    //   })
    // })

    console.log('PROVINCE', PROVINCE)
    setOptionsAddressArr(PROVINCE)
  }

  const handleAreaClick = (
    e,
    label,
    option
  ) => {
    e.stopPropagation()
    console.log('clicked', label, option)
  }

  const displayRender = (labels, selectedOptions) => {
    labels.map((label, i) => {
      const option = selectedOptions[i]
      if (i === labels.length - 1) {
        return (
          <span key={option.value}>
            <a onClick={e => handleAreaClick(e, label, option)}>{label}</a>
          </span>
        )
      }
      return <span key={option.value}>{label} / </span>
    })
  }

  const onChangeOrderAddressStreet = async (value) => {
    console.log('onChangeCasacderSeller', value)
    console.log('onChangeCasacderSeller', value?.target)
    console.log('onChangeCasacderSeller', value?.target?.value)

    const paneTemp = [...panes]
    paneTemp[currentPaneIndex].shippingInfo.orderAdressStreet = value?.target?.value.trim() || ''
    setPanes(paneTemp)
  }

  const onChangeCasacderSeller = async (value) => {
    console.log('onChangeOrderAddressStreet', value)
    const paneTemp = [...panes]
    paneTemp[currentPaneIndex].shippingInfo.orderAdressProvince = value[0]
    paneTemp[currentPaneIndex].shippingInfo.orderAdressDistrict = value[1]
    paneTemp[currentPaneIndex].shippingInfo.orderAdressWard = value[2]
    const formDataFee = {
      orderAdressProvince: value[0],
      orderAdressDistrict: value[1],
      orderAdressWard: value[2]
    }
    message.loading('Đang lấy thông tin phí shipping...', 2)
    const resFee = await GapService.getFeeForTransport(formDataFee, paneTemp?.[currentPaneIndex]?.shippingInfo?.optionTransfer === 'ht')
    console.log('getFeeForTransport', resFee)

    if (resFee && resFee.result) {
      paneTemp[currentPaneIndex].shippingInfo.shippingFee = resFee.result
      setPanes(paneTemp)
    } else {
      showNotification('Không thể ước tính phí ship')
    }
  }

  return (
    <div className='saleScreen-container'>
      <Tabs defaultActiveKey='0' activeKey={currentPaneIndex} type='editable-card' onChange={onChangeTab} onEdit={onEdit}>
        {panes.map((pane, indexPane) => (
          <TabPane
            tab={Number(currentPaneIndex) === Number(indexPane) ? (
              <div className='choosenTagBox'>
                <span className='choosenTagBoxTitle'>{pane.title}</span>
                <span className='closeTag-icon' onClick={() => remove(pane.key)}>
                  X
                </span>
              </div>
            )
              : (
                <div className='not-choosenTagBox'>
                  <span className='choosenTagBoxTitle'>{pane.title}</span>
                  <span className='closeTag-icon' onClick={() => remove(pane.key)}>
                  X
                  </span>
                </div>
              )
            }
            key={pane.key}
            closable={false}
            className={{ color: 'red' }} />
        ))}
      </Tabs>

      {panes[currentPaneIndex] && !panes[currentPaneIndex].isCreatedSuccessfully
        ? (
          <div className='saleScreen-container-inner'>
            <div className='InputBox'>
              <Input id='SearchbyScanning' onKeyDown={onKeyPressBarcode} onBlur={barcodeAutoFocus} suffix={<QrcodeOutlined />} ref={node => { searchInput = node }} onChange={onChangeTextProductInput} value={panes[currentPaneIndex].inputText} onPressEnter={onHandleEnterAndCheckIdProduct} autoFocus className='inputID' placeholder='Nhập ID Sản Phẩm' />
              <Checkbox.Group options={optionsTypeOnlineSale} value={panes[currentPaneIndex].isOnlineSale} defaultValue={['false']} onChange={onChangeRadioTypeOnlineSale} />
              <Button onClick={onHandleCreateOrder} className='buttonCreateBox'>
                <span>Tạo Đơn Hàng</span>
              </Button>
            </div>
            {/* <Divider style={{ margin: '10px 0' }} orientation='left'>Danh sách sản phẩm{`${panes[currentPaneIndex].isOnlineSale} + ${currentPaneIndex} + ${panes[currentPaneIndex].title}`}</Divider> */}

            <div className='ContentBox'>
              <div className='productBox'>
                <Divider style={{ margin: '15px 0' }} orientation='left'>Danh sách sản phẩm{panes[currentPaneIndex].totalNumberOfProductForSale ? `:  ${panes[currentPaneIndex].totalNumberOfProductForSale} món` : '' }</Divider>
                {
                  panes[currentPaneIndex].productList.length > 0
                    ? <List
                      style={{ maxHeight: '50vh' }}
                      itemLayout='horizontal'
                      dataSource={panes[currentPaneIndex].productList}
                      header={
                        <List.Item className='itemBox' style={{ backgroundColor: 'whitesmoke', margin: '0' }}>
                          <div className='item-stt'>
                        #
                          </div>
                          <div className='item-name'>
                            <span>Mã sản phẩm</span>
                            <span>Tên sản phẩm</span>
                          </div>
                          <div className='item-sl'>
                        SL
                          </div>
                          <div className='item-price'>
                        Giá
                          </div>
                          <div className='item-totalPrice'>
                        Tổng giá
                          </div>
                        </List.Item>
                      }
                      renderItem={(item, itemIndex) => (
                        <List.Item className='itemBox'>
                          <div className='item-stt'>
                            {itemIndex + 1}
                            <div className='deleteIcon' onClick={() => onDeleteProductItem(itemIndex)}>
                              <DeleteOutlined style={{ color: colors.red[300] }} />
                            </div>
                          </div>
                          <div className='item-name'>
                            <span className='item-name-code'>{item.code}</span>
                            <span>{item.name}</span>
                          </div>
                          <div className='item-sl'>
                            <InputNumber min={1} max={item.remainNumberProduct || 1} defaultValue={1} value={item.numberOfProductForSale || 1} onChange={(value) => onChangeProductItem(value, 'productNumber', itemIndex)} />
                            <span className='item-sl-max'>Max: {item.remainNumberProduct}</span>
                          </div>
                          <div className='item-price'>
                            {numberWithCommas(item.price * 1000)} vnđ
                          </div>
                          <div className='item-totalPrice'>
                            {numberWithCommas(item.price * 1000 * (item.numberOfProductForSale || 1))} vnđ
                          </div>
                        </List.Item>
                      )}
                    />
                    : <Empty description={false} />
                }
              </div>

              <div className='informationBox'>
                <Divider style={{ margin: '15px 0' }} orientation='left'>Thông tin đơn hàng</Divider>
                <div className='saleInfoBox'>
                  <div className='totalPriceBox'>
                    <span className='totalPriceTxt'>Tổng tiền: </span>
                    <span className='totalPriceValue'>{numberWithCommas((panes[currentPaneIndex].totalMoneyForSale || 0) * 1000)} vnđ</span>
                  </div>

                  <div className='typeTranferBox'>
                    <span className='typeTranferTxt'>Hình thức trả tiền: </span>
                    <Checkbox.Group options={panes[currentPaneIndex].isOnlineSale === 'true' ? optionsTransferMoneyWithBank : optionsTransferMoney} value={panes[currentPaneIndex].isTransferWithBankAndOffline === 'true' ? 'both' : panes[currentPaneIndex].isTransferWithBank || 'false'} defaultValue={['false']} onChange={onChangeRadioTransferMoney} />
                  </div>

                  {
                    panes[currentPaneIndex].isTransferWithBankAndOffline === 'true' ? (
                      <div className='customerInfoBox' style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <div className='phoneBox'>
                          <span className='phoneTxt'>Tiền mặt: </span>
                          <Input value={panes[currentPaneIndex]?.transferOfflineMoneyAmount} minLength={1} maxLength={11} allowClear onChange={(value) => onChangeDataClient(value, 'transferOfflineMoneyAmount')} placeholder='0 vnd' />
                        </div>
                        <div className='phoneBox'>
                          <span className='phoneTxt'>Tiền chuyển khoản: </span>
                          <Input value={panes[currentPaneIndex]?.transferBankMoneyAmount} minLength={1} maxLength={11} allowClear onChange={(value) => onChangeDataClient(value, 'transferBankMoneyAmount')} placeholder='0 vnd' />
                        </div>
                      </div>
                    ) : null
                  }

                  <div className='typeTranferBox'>
                    <span className='typeTranferTxt'>Lưu ý: </span>
                    <TextArea placeholder='Ghi Chú' value={panes[currentPaneIndex].note || ''} type={'number'} id='note' key='note' onChange={onHanleChangeTextNote} />
                  </div>
                </div>

                <Divider style={{ margin: '15px 0' }} orientation='left'>Thông tin khách hàng</Divider>

                <div className='customerInfoBox'>
                  <div className='phoneBox'>
                    <span className='phoneTxt'>Số điện thoại: </span>
                    <Input value={panes[currentPaneIndex]?.clientInfo?.phoneNumber} minLength={10} maxLength={11} allowClear onChange={fetchUserByPhoneNumber} placeholder='...' suffix={panes[currentPaneIndex].isLoadingUser ? <LoadingOutlined /> : panes[currentPaneIndex].isFoundUser ? <CheckCircleFilled style={{ color: 'green ' }} /> : null} />
                  </div>

                  <div className='phoneBox'>
                    <span className='phoneTxt'>Tên khách hàng: </span>
                    <Input value={panes[currentPaneIndex]?.clientInfo?.fullName} minLength={10} maxLength={11} allowClear onChange={(value) => onChangeDataClient(value, 'fullName')} placeholder='...' />
                  </div>

                  <div className='phoneBox'>
                    <span className='phoneTxt'>Chứng minh nhân dân: </span>
                    <Input value={panes[currentPaneIndex]?.clientInfo?.consignerIdCard} minLength={10} maxLength={11} allowClear onChange={(value) => onChangeDataClient(value, 'consignerIdCard')} placeholder='...' />
                  </div>

                  <div className='phoneBox'>
                    <span className='phoneTxt'>Email: </span>
                    <Input value={panes[currentPaneIndex]?.clientInfo?.mail} minLength={5} maxLength={50} allowClear onChange={(value) => onChangeDataClient(value, 'mail')} placeholder='...' />
                  </div>

                  <div className='phoneBox'>
                    <span className='phoneTxt'>Tên ngân hàng: </span>
                    <Input value={panes[currentPaneIndex]?.clientInfo?.bankName} allowClear onChange={(value) => onChangeDataClient(value, 'bankName')} placeholder='...' />
                  </div>

                  <div className='phoneBox'>
                    <span className='phoneTxt'>ID ngân hàng: </span>
                    <Input value={panes[currentPaneIndex]?.clientInfo?.bankId} allowClear onChange={(value) => onChangeDataClient(value, 'bankId')} placeholder='...' />
                  </div>

                  <div className='phoneBox'>
                    <span className='phoneTxt'>Sinh nhật: </span>
                    <Input value={panes[currentPaneIndex]?.clientInfo?.birthday} allowClear onChange={(value) => onChangeDataClient(value, 'birthday')} placeholder='...' />
                  </div>
                </div>

                {
                  panes[currentPaneIndex].isOnlineSale === 'true'
                    ? <div style={{ marginBottom: '2em' }}>
                      <Divider style={{ margin: '15px 0' }} orientation='left'>Thông tin vận chuyển</Divider>
                      <div className='customerInfoBox'>
                        <div className='phoneBox'>
                          <span className='phoneTxt'>Địa chi lấy hàng: </span>
                          <Input disabled={panes[currentPaneIndex].shippingInfo.optionTransfer === 'tt'} value={ADDRESS_STREET_GET_ORDER} allowClear placeholder='...' />
                        </div>
                        <div className='phoneBox'>
                          <Cascader
                            disabled={panes[currentPaneIndex].shippingInfo.optionTransfer === 'tt'}
                            options={optionsAddressArr}
                            value={ADDRESS_GET_ORDER_ARRAY}
                            defaultValue={ADDRESS_GET_ORDER_ARRAY}
                            displayRender={displayRender}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div className='phoneBox'>
                          <span className='phoneTxt'>Địa chỉ giao hàng: </span>
                          <Input disabled={panes[currentPaneIndex].shippingInfo.optionTransfer === 'tt'} onChange={onChangeOrderAddressStreet} value={panes[currentPaneIndex]?.shippingInfo?.orderAdressStreet} allowClear placeholder='Số nhà - đường' />
                          {/* <Input value={panes[currentPaneIndex]?.shippingInfo?.addressFromInfo?.pick_province} minLength={10} maxLength={11} allowClear onChange={(value) => onChangeDataShipping(value, 'pick_province')} placeholder='...'  /> */}
                        </div>
                        <div className='phoneBox'>
                          <Cascader
                            allowClear
                            showSearch
                            disabled={panes[currentPaneIndex].shippingInfo.optionTransfer === 'tt'}
                            placeholder='Thành phố/Tỉnh - Quận/Huyện - Xã/Phường'
                            options={optionsAddressArr}
                            defaultValue={[]}
                            displayRender={displayRender}
                            style={{ width: '100%' }}
                            onChange={onChangeCasacderSeller}
                          />
                        </div>

                        <div className='typeTranferBox'>
                          <span className='typeTranferTxt'>Hình thức trả tiền: </span>
                          <Checkbox.Group options={optionsTransferOrder} value={panes[currentPaneIndex].shippingInfo.optionTransfer || 'tk'} defaultValue={['tk']} onChange={onChangeRadioTransferOrder} />
                        </div>

                        <div className='phoneBox'>
                          <span className='phoneTxt'>Phí giao hàng </span>

                          <span className='phoneTxt'>{panes[currentPaneIndex]?.shippingInfo?.shippingFee} vnd</span>

                          {/* <Input suffix={<span>vnđ</span>} defaultValue={0} value={panes[currentPaneIndex]?.shippingInfo?.shippingFee} placeholder='0' /> */}
                        </div>
                      </div>
                    </div> : null

                }
              </div>
            </div>

          </div>
        ) : panes[currentPaneIndex] && panes[currentPaneIndex].isCreatedSuccessfully ? (
          <div className='successBox'>
            {
              panes[currentPaneIndex] && panes[currentPaneIndex].isOnlineSale === 'true' ? <>
                <Steps style={{ padding: '10px 5%', marginBottom: '10%' }} current={0} onChange={onChangeStep}>
                  <Step status='finish' title='Đơn Hàng' description='Bước 1' />
                  <Step status='finish' title='Khách Hàng' description='Bước 2' />
                  <Step status='finish' title='Vận chuyển' description='Bước 3' />
                  <Step status='finish' title='Hoàn Thành' description='' />
                </Steps>
                </> : <>
                  <Steps style={{ padding: '10px 5%', marginBottom: '10%' }} current={0} onChange={onChangeStep}>
                    <Step status='finish' title='Đơn Hàng' description='Bước 1' />
                    <Step status='finish' title='Khách Hàng' description='Bước 2' />
                    <Step status='finish' title='Hoàn Thành' description='' />
                  </Steps>
                </>
            }

            <div style={{ display: 'flex' }}>
              <ReactToPrint
                content={reactToPrintContent}
                // onAfterPrint={handleAfterPrint}
                // onBeforeGetContent={handleOnBeforeGetContent}
                // onBeforePrint={handleBeforePrint}
                removeAfterPrint
                trigger={reactToPrintTrigger}
              />
              <Button className='createNewButton' onClick={resetData}>Tạo mới</Button>
            </div>

            <div id='BoxContainer'>
              <ReceiptOffline data={panes[currentPaneIndex]} ref={componentRef} />
            </div>
          </div>
        ) : null}

      {/* <button onClick={() => printWithId('qrcode')}>Print qrcode</button> */}

      {/* {
        panes && panes[currentPaneIndex] && panes[currentPaneIndex]?.isCreatedSuccessfully && (
          <>
            <div id='BoxContainer'>
              <ReceiptOffline data={panes[currentPaneIndex]} ref={(el) => (componentRef = el)} />
            </div>
          </>

        )
      } */}

      {/* <div id='BoxContainer'>
        <ReceiptOffline data={panes[currentPaneIndex]} ref={(el) => (componentRef = el)} />
      </div> */}

      {/* <div>
        <object>
          <embed id='pdfID' type='text/html' width='1200' height='600' src={`data:application/pdf;base64,${base64}`} />
        </object>
      </div> */}

      {/* <div id='qrcode'>
        <style type='text/css' media='print'>
          {'\
   @page { size: portrait; }\
'}
        </style>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <p style={{ fontSize: '10px', width: '65px', wordBreak: 'break-all', margin: '0px' }}>123-432-1</p>
        <p style={{ fontSize: '10px', width: '65px', wordBreak: 'break-all', margin: '0px' }}>100.000đ</p>
        <p style={{ fontSize: '10px', width: '65px', wordBreak: 'break-all', margin: '0px' }}>Đầm đỏ balenca</p>
      </div> */}

    </div>
  )
}

const mapStateToProps = state => ({
  locale: state.locale.lang,
  key: state.locale.lang,
  messages: state.locale.messages,
  userData: state.userData,
  addressInfoArrayRedux: state.addressInfoArrayRedux
})

export default withRouter(connect(mapStateToProps, null)(SaleScreen))
