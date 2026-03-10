/* eslint-disable react/display-name */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { withRouter } from 'next/router'
import { connect } from 'react-redux'
import { Form, Row, Col, Layout, Input, Button, Badge, Spin, Descriptions, Tabs, Table, Radio, Popconfirm, DatePicker } from 'antd'
import { images } from 'config/images'
import MyModal from 'pages/Components/MyModal'
import { showNotification, numberWithCommas, convertObjectToArray } from 'common/function'
import { DeleteFilled, LoadingOutlined, SearchOutlined } from '@ant-design/icons'
import { Router } from 'common/routes'
import { isMobile } from 'react-device-detect'
import './style.scss'
import Lottie from 'react-lottie'
import GapService from 'controller/Api/Services/Gap'
import { filter, isEqual } from 'lodash'
import Highlighter from 'react-highlight-words'
import { EMAIL_TITLE, EMAIL_TYPE } from 'common/constants'
import moment from 'moment'
import BillOrderGHTK from './components/BillOrderGHTK'
import ReactToPrint from 'react-to-print'
import ReceiptOffline from './components/ReceiptOffline'
import TagPrintBox from './components/TagPrintBox'
const { RangePicker } = DatePicker
const { TabPane } = Tabs

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm()
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  )
}

const EditableContext = React.createContext(null)

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  const form = useContext(EditableContext)
  useEffect(() => {
    if (editing) {
      inputRef.current.focus()
    }
  }, [editing])

  const toggleEdit = () => {
    setEditing(!editing)
    form.setFieldsValue({
      [dataIndex]: record[dataIndex]
    })
  }

  const save = async () => {
    try {
      const values = await form.validateFields()
      toggleEdit()
      handleSave({ ...record, ...values })
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  let childNode = children

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`
          }
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className='editable-cell-value-wrap'
        style={{
          paddingRight: 24
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    )
  }

  return <td {...restProps}>{childNode}</td>
}

class TableOrderScreen extends React.PureComponent {
  constructor (props) {
    super(props)
    this.columns = [
      {
        title: 'Mã đơn hàng',
        dataIndex: 'objectId',
        key: '0',
        width: 140,
        // editable: true,
        ...this.getColumnSearchKeyProps('objectId')
      },
      {
        title: 'Tên khách hàng',
        dataIndex: 'fullName',
        key: '1',
        width: 220
        // ...this.getColumnSearchKeyProps('fullName')
        // ...this.getColumnSearchProps('consignerName')
        // ...this.getColumnSearchPropsConsignmentName('consignerName')
      },
      {
        title: 'Số điện thoại',
        width: 150,
        dataIndex: 'phoneNumber',
        key: '2',
        ...this.getColumnSearchKeyProps('phoneNumber')
      },
      {
        title: 'Số lượng',
        width: 80,
        dataIndex: 'totalNumberOfProductForSale',
        key: '3'
        // editable: true
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalMoneyForSale',
        key: '4',
        width: 140,
        // editable: true,
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      },
      {
        title: 'Tiền mặt',
        dataIndex: 'transferOfflineMoneyAmount',
        key: '4',
        width: 140,
        // editable: true,
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      },
      {
        title: 'Tiền chuyển khoản',
        dataIndex: 'transferBankMoneyAmount',
        key: '4',
        width: 140,
        // editable: true,
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      },
      {
        title: 'Thanh toán',
        dataIndex: 'isTransferMoneyWithBank',
        width: 120,
        key: '5',
        ...this.getColumnSearchTransferOrNot('isTransferMoneyWithBank')
      },
      {
        title: 'Hình thức',
        dataIndex: 'isOnlineSale',
        width: 120,
        key: '6',
        ...this.getColumnSearchOnlineOrNot('isOnlineSale')
      },
      {
        title: 'Thời gian tạo đơn',
        dataIndex: 'createdAt',
        width: 120,
        key: '7'
      },
      {
        title: 'Thời gian nhận tiền',
        dataIndex: 'timeConfirmGetMoney',
        width: 120,
        key: '8'
      },
      {
        title: '',
        key: '9',
        width: 120,
        // fixed: 'right',
        render: (value) => (<Button style={{ width: '100%' }} onClick={() => this.onDeleteButton(value)}>Xoá</Button>)
      },
      {
        title: 'GHTK',
        key: '10',
        width: 170,
        // fixed: 'right',
        render: (value) => value.isOnlineSale === 'Online' ? this.ghtkActionView(value) : null
      },
      {
        title: 'Bill',
        key: '11',
        width: 170,
        // fixed: 'right',
        render: (value) => this.billPrintView(value)
      },
      {
        title: 'Nhận tiền',
        key: '12',
        width: 90,
        fixed: 'right',
        // ...this.getColumnSearchIsGetMoney('isGetMoney'),
        render: (value) =>
          this.state.orderData.length >= 1 ? (
            <Popconfirm title='Xác nhận' onConfirm={() => this.onChangeRadioIsGetMoney(value)}>
              <Radio.Button disabled={value.isOnlineSale === 'Offline'} className={value.isGetMoney ? 'radio-true-isGetMoney' : 'radio-false-isGetMoney'} value={value.isGetMoney}>{value.isGetMoney ? 'Rồi' : 'Chưa'}</Radio.Button>
            </Popconfirm>
          ) : null
      }
    ]
    this.state = {
      orderData: [],
      total: 0,
      page: 1,
      selectedKeys: {},
      searchText: '',
      searchedColumn: '',
      tabKey: '1',
      isLoadingTags: false,
      tags: [],
      allInfoTag: [],
      currentTag: '',
      currentPagination: 1,
      fromDateMoment: null,
      toDateMoment: null,
      chosenBillOrder: null
    }
    this.myModal = React.createRef()
  }

  componentDidMount () {
    this.fetchAllTags()
  }

  componentDidUpdate () {

  }

  onRefeshPage = () => {
    this.fetchAllTags()
  }

  translateStatusName = (value) => {
    switch (value.transporter.status) {
    case 'WAITING_PICK_UP':
      return 'Đang chờ lấy hàng'
    case 'DELIVERING':
      return 'Đang vận chuyển'
    case 'DELIVERED':
      return 'Đã chuyển tới khách'
    case 'FAILED':
      return 'Đơn hàng bị lỗi'
    case 'RETURNING_BACK':
      return 'Đang trả hàng về'
    case 'RETURNED_BACK':
      return 'Đã trả về'
    case 'CANCELLED':
      return 'Đã huỷ đơn hàng'
    }
  }

  ghtkActionView = (value) => {
    if (!value) {
      return null
    }
    if (value && !value.transporter) {
      return (
        <Button style={{ width: '100%' }} onClick={() => this.onPushOrderToGHTK(value)}>Tạo đơn GHTK</Button>
      )
    } else if (value.transporter.success) {
      return (
        <>
          <Button style={{ width: '100%', marginBottom: '5px' }} onClick={() => this.onOpenGHTKDetailModal(value)}>Xem đơn GHTK</Button>
          <p>Tình trạng: {this.translateStatusName(value)}</p>
        </>
      )
    }
  }

  reactToPrintTrigger = (value) => {
    // NOTE: could just as easily return <SomeComponent />. Do NOT pass an `onClick` prop
    // to the root node of the returned component as it will be overwritten.

    // Bad: the `onClick` here will be overwritten by `react-to-print`
    // return <button onClick={() => alert('This will not work')}>Print this out!</button>;

    // Good
    // return <button>Print using a Class Component</button>;
    return <Button style={{ width: '100%' }} onClick={() => this.printBillOrder(value)}>In Bill</Button>
  }

  setComponentRef = (ref) => {
    this.componentRef = ref
  }

  reactToPrintContent = () => {
    return this.componentRef
  }

  billPrintView = (value) => {
    if (!value) {
      return null
    }

    return (
      <>
        <TagPrintBox data={value} />
      </>
    )
  }

  expandedRowRender = (recordData) => {
    const components = {
      body: {
        row: EditableRow,
        cell: EditableCell
      }
    }

    const columns = [
      {
        title: 'Mã SP',
        dataIndex: 'code',
        key: 'code'
        // editable: true,
        // width: 180
      },
      {
        title: 'Mã ký gửi',
        dataIndex: 'consignmentId',
        key: 'consignmentId'
        // editable: true,
        // width: 180
      },
      {
        title: 'Tên SP',
        dataIndex: 'name',
        key: 'name'
        // editable: true,
        // width: 250
      },
      {
        title: 'Giá',
        dataIndex: 'price',
        key: 'price',
        // editable: true,
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      },
      {
        title: 'Số lượng',
        dataIndex: 'count',
        key: 'count'
        // editable: true,
        // width: 100
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalMoney',
        key: 'moneyBackProduct',
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      }
    ]

    const data = []

    console.log('item')
    console.log(recordData)

    recordData && recordData.productList && recordData.productList.map((item, index) => {
      console.log('item', item)
      data.push({
        key: index,
        name: item.name,
        note: item.note,
        categoryId: item.categoryId,
        code: item.code || '',
        price: Number(item.price) || 0,
        count: Number(item.count) || 0,
        consignmentId: item.consignment.consignmentId,
        priceAfterFee: Number(item.priceAfterFee) || 0,
        soldNumberProduct: Number(item.soldNumberProduct) || 0,
        remainNumberProduct: Number(item.count) - Number(item.soldNumberProduct || 0),
        moneyBackProduct: Number(item.soldNumberProduct || 0) * Number(item.priceAfterFee),
        totalMoney: (Number(item.count) || 0) * Number(item.price) || 0,
        shippingInfo: item.shippingInfo,
        transporter: item.transporter
      })
    })

    const formatedColumns = columns.map((col) => {
      if (!col.editable) {
        return col
      }

      return {
        ...col,
        onCell: (record) => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: (row) => this.handleSaveNestTable(row, recordData)
        })
      }
    })

    return <Table
      scroll={{ x: 800, y: '55vh' }}
      components={components}
      columns={formatedColumns}
      dataSource={data}
      pagination={false}
    />
  };

  convertDataIndexToName = (dataIndex) => {
    console.log('dataIndex')
    console.log(dataIndex)
    switch (dataIndex) {
    case 'consignerName':
      return 'Tìm tên khách hàng'
    case 'phoneNumber':
      return 'Tìm số điện thoại'
    }
  }

  setSelectedKeys = (value, keyColumn) => {
    console.log(value)
    console.log(keyColumn)
    this.setState({
      selectedKeys: {
        ...this.state.selectedKeys,
        [keyColumn]: value
      } || {}
    })
  }

  handleSearch = (confirm) => {
    const { selectedKeys } = this.state
    console.log('handleSearch')
    console.log(selectedKeys)
    this.fetchTableData(1)
    confirm()
  };

  handleReset = (clearFilters, keyColumn) => {
    const { selectedKeys } = this.state
    const selectedKeysTemp = { ...selectedKeys }
    if (selectedKeysTemp && selectedKeysTemp[keyColumn]) {
      delete selectedKeysTemp[keyColumn]
      console.log('selectedKeysTemp')
      console.log(selectedKeysTemp)
      this.setState({ selectedKeys: selectedKeysTemp }, () => {
        this.fetchTableData(1)
        clearFilters()
      })
    }
  };

  onOpenGHTKDetailModal = (value) => {
    if (value && value?.transporter?.res?.order) {
      this.myModal.current.openModal(this.renderDetailGHTKBox(value), { closable: true })
    }
  }

  cancelOrder = async (value) => {
    const deleteTransport = await GapService.deleteTransport(value)
    console.log('deleteTransport', deleteTransport)
    if (deleteTransport?.result?.success) {
      showNotification('Xoá đơn thành công')
    } else {
      showNotification('Xoá đơn không thành công')
    }
  }

  printOrder = (orderId) => {
    if (orderId) {
      this.myModal.current.openModal(<BillOrderGHTK orderId={orderId} />, { closable: true, modalWidth: '50vh' })
    }
  }

  printBillOrder = () => {

  }

  trackingOrder = (labelId) => {
    window.open(`https://i.ghtk.vn/${labelId}`, '_blank')
  }

  renderDetailGHTKBox = (value) => {
    const shipData = value && value?.transporter?.res?.order
    return (
      <div>
        <p className='text text-title MB10'>Giao hàng tiết kiệm</p>
        <p>ID đơn hàng trên GHTK: {shipData.label_id}</p>
        <p>ID đơn hàng kho GAP: {shipData.partner_id}</p>

        <p>Tình trạng: {shipData.status_text}</p>
        <p>Tên khách hàng: {shipData.customer_fullname}</p>
        <p>SĐT khách hàng: {shipData.customer_tel}</p>
        <p>Ngày dự kiến: {shipData.deliver_date}</p>
        <p>Ngày nhận hàng: {shipData.pick_date}</p>
        <p>Phí giao hàng: {numberWithCommas(shipData.ship_money)} vnđ</p>
        <p>Địa chỉ giao hàng: {shipData.address}</p>

        <Button className='MT10' onClick={() => this.cancelOrder(value?.transporter?.order?.objectId)}>Huỷ Đơn Hàng</Button>
        <Button className='MT10 ML10' onClick={() => this.printOrder(value?.transporter?.order?.objectId)}>In Đơn Hàng</Button>
        <Button className='MT10 ML10' onClick={() => this.trackingOrder(shipData.label_id)}>Tra cứu GHTK</Button>
      </div>
    )
  }

  onPushOrderToGHTK = async (row) => {
    if (row && !row.isGetMoney) {
      showNotification(`Vui lòng xác nhận Nhận Tiền trước`)
      return
    }
    console.log('row - onPushOrderToGHTK', row)
    const res = await GapService.pushOrderToGHTK(row)

    if (res) {
      if (res.error) {
        showNotification(res.error || 'Cập nhật GHTK chưa được')
        return
      }
      this.onRefeshPage()
    } else {
      showNotification(`Cập nhật GHTK chưa được`)
    }

    console.log('res - onPushOrderToGHTK', res)
  }

  onChangeRadioIsGetMoney = async (row) => {
    console.log('onChangeRadioIsGetMoney')
    console.log(row)

    const newData = [...this.state.orderData]
    const index = newData.findIndex((item) => row.objectId === item.objectId)
    const item = newData[index]
    let newItem = { ...item, ...row, isGetMoney: !item.isGetMoney }

    if (newItem && newItem.isGetMoney === true) {
      newItem = { ...item, ...row, isGetMoney: !item.isGetMoney, timeConfirmGetMoney: moment().format('DD-MM-YYYY HH:mm') }
    }

    if (!isEqual(newItem, item)) {
      newData.splice(index, 1, newItem)
      console.log('row')
      this.setState({
        orderData: newData
      }, async () => {
        console.log(newItem)
        // const customerFormData = {
        //   consignerName: row.consignerName,
        //   phoneNumber: row.phoneNumber,
        //   numberOfProducts: row.numberOfProducts,
        //   consignerIdCard: row.consignerIdCard,
        //   mail: row.email,
        //   bankName: row.bankName,
        //   bankId: row.bankId,
        //   timeConfirmGetMoney: row.timeConfirmGetMoney
        // }

        // if (newItem && newItem.isGetMoney && newItem.email && newItem.email.length > 0) {
        //   GapService.sendMail(customerFormData, row, EMAIL_TYPE.PAYMENT, EMAIL_TITLE.PAYMENT)
        // }

        const res = await GapService.updateOrder(newItem)
        console.log(res)
        if (res) {
          showNotification(`Cập nhật thành công ${item.phoneNumber}`)
        } else {
          showNotification(`Cập nhật chưa được`)
        }
      })
    }
  }

  onChangeRadioSearch = (value, clearFilters) => {
    console.log('onChangeRadioSearch')
    console.log(value.target.value)
    // e.target.value
    if (value.target.value === 'true') {
      this.setState({
        selectedKeys: {
          ...this.state.selectedKeys,
          isTransferMoneyWithBank: 'true'
        } || {}
      }, () => {
        this.fetchTableData(1)
        clearFilters()
      })
    } else if (value.target.value === 'false') {
      this.setState({
        selectedKeys: {
          ...this.state.selectedKeys,
          isTransferMoneyWithBank: 'false'
        } || {}
      }, () => {
        this.fetchTableData(1)
        clearFilters()
      })
    } else {
      const { selectedKeys } = this.state
      const selectedKeysTemp = { ...selectedKeys }
      if (selectedKeysTemp && selectedKeysTemp.isTransferMoneyWithBank) {
        delete selectedKeysTemp.isTransferMoneyWithBank
        console.log('selectedKeysTemp')
        console.log(selectedKeysTemp)
        this.setState({ selectedKeys: selectedKeysTemp }, () => {
          this.fetchTableData(1)
          clearFilters()
        })
      }
    }
  }

  onChangeRadioSearchIsOnline = (value, clearFilters) => {
    console.log('onChangeRadioSearch')
    console.log(value.target.value)
    // e.target.value
    if (value.target.value === 'true') {
      this.setState({
        selectedKeys: {
          ...this.state.selectedKeys,
          isOnlineSale: 'true'
        } || {}
      }, () => {
        this.fetchTableData(1)
        clearFilters()
      })
    } else if (value.target.value === 'false') {
      this.setState({
        selectedKeys: {
          ...this.state.selectedKeys,
          isOnlineSale: 'false'
        } || {}
      }, () => {
        this.fetchTableData(1)
        clearFilters()
      })
    } else {
      const { selectedKeys } = this.state
      const selectedKeysTemp = { ...selectedKeys }
      if (selectedKeysTemp && selectedKeysTemp.isOnlineSale) {
        delete selectedKeysTemp.isOnlineSale
        console.log('selectedKeysTemp')
        console.log(selectedKeysTemp)
        this.setState({ selectedKeys: selectedKeysTemp }, () => {
          this.fetchTableData(1)
          clearFilters()
        })
      }
    }
  }

  getColumnSearchOnlineOrNot = keyColumn => ({
    filterDropdown: ({ confirm, clearFilters }) => (
      <div style={{ padding: 10 }}>
        {/* <Space> */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Radio.Group onChange={value => this.onChangeRadioSearchIsOnline(value, clearFilters)} defaultValue=''>
            <Radio.Button onClick={value => this.onChangeRadioSearchIsOnline(value, clearFilters)} value={'false'}>Offline</Radio.Button>
            <Radio.Button onClick={value => this.onChangeRadioSearchIsOnline(value, clearFilters)} value={'true'}>Online</Radio.Button>
            <Radio.Button onClick={value => this.onChangeRadioSearchIsOnline(value, clearFilters)} value={'all'}>Tất cả</Radio.Button>
          </Radio.Group>
        </div>
      </div>
    ),
    filterIcon: filter => <SearchOutlined
      style={{ color:
        (this.state.selectedKeys?.isOnlineSale?.length > 0 && keyColumn === 'isOnlineSale')
          ? '#1890ff' : undefined }}
    />
  });

  getColumnSearchTransferOrNot = keyColumn => ({
    filterDropdown: ({ confirm, clearFilters }) => (
      <div style={{ padding: 10 }}>
        {/* <Space> */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Radio.Group onChange={value => this.onChangeRadioSearch(value, clearFilters)} defaultValue=''>
            <Radio.Button onClick={value => this.onChangeRadioSearch(value, clearFilters)} value={'false'}>Trực tiếp</Radio.Button>
            <Radio.Button onClick={value => this.onChangeRadioSearch(value, clearFilters)} value={'true'}>Chuyển khoản</Radio.Button>
            <Radio.Button onClick={value => this.onChangeRadioSearch(value, clearFilters)} value={'all'}>Tất cả</Radio.Button>
          </Radio.Group>
        </div>
      </div>
    ),
    filterIcon: filter => <SearchOutlined
      style={{ color:
        (this.state.selectedKeys?.isTransferMoneyWithBank?.length > 0 && keyColumn === 'isTransferMoneyWithBank')
          ? '#1890ff' : undefined }}
    />
  });

  getColumnSearchKeyProps = keyColumn => ({
    filterDropdown: ({ confirm, clearFilters }) => (
      <div style={{ padding: 10 }}>
        <Input
          autoFocus
          ref={node => {
            this.searchInput = node
          }}
          placeholder={this.convertDataIndexToName}
          value={this.state.selectedKeys[keyColumn]}
          onChange={e => this.setSelectedKeys(e.target.value ? e.target.value : [], keyColumn)}
          onPressEnter={() => this.handleSearch(confirm)}
          style={{ width: '100%', marginBottom: 8, display: 'block' }}
        />
        {/* <Space> */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Button
            type='primary'
            onClick={() => this.handleSearch(confirm)}
            icon={<SearchOutlined />}
            size='small'
            style={{ width: '100%', marginBottom: '10px', marginTop: '10px' }}
          >
            Tìm kiếm
          </Button>
          <Button
            type='primary'
            onClick={() => this.handleReset(clearFilters, keyColumn)}
            icon={<DeleteFilled />}
            size='small'
            style={{ width: '100%' }}
          >
          Xoá
          </Button>
        </div>
        {/* <Button
          type='link'
          size='small'
          onClick={() => {
            confirm({ closeDropdown: false })
            this.setState({
              searchText: selectedKeys[0],
              searchedColumn: dataIndex
            })
          }}
        >
            Filter
        </Button> */}
        {/* </Space> */}
      </div>
    ),
    filterIcon: filter => <SearchOutlined
      style={{ color:
        (this.state.selectedKeys?.phoneNumber?.length > 0 && keyColumn === 'phoneNumber') ||
        (this.state.selectedKeys?.fullName?.length > 0 && keyColumn === 'fullName') ||
        (this.state.selectedKeys?.objectId?.length > 0 && keyColumn === 'objectId') ||
        (this.state.selectedKeys?.totalNumberOfProductForSale?.length > 0 && keyColumn === 'totalNumberOfProductForSale')
          ? '#1890ff' : undefined }}
    />,
    // onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select(), 100)
      }
    }
    // render: text =>
    //   this.state.searchedColumn === dataIndex ? (
    //     <Highlighter
    //       highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
    //       searchWords={[this.state.searchText]}
    //       autoEscape
    //       textToHighlight={text ? text.toString() : ''}
    //     />
    //   ) : (
    //     text
    //   )
  });

  convertPriceAfterFee = (productPrice = 0) => {
    let moneyBackForFullSold = Number(productPrice)

    if (productPrice > 0) {
      if (productPrice < 1000) {
        moneyBackForFullSold = productPrice * 74 / 100
      } else if (productPrice >= 1000 && productPrice <= 10000) {
        moneyBackForFullSold = productPrice * 77 / 100
      } else if (productPrice > 10000) {
        moneyBackForFullSold = productPrice * 80 / 100
      }

      return moneyBackForFullSold
    } else {
      return 0
    }
  }

  handleSaveNestTable = (row, record) => {
    console.log('row - handleSaveNestTable')
    console.log(row)
    // console.log(record)

    const newData = [...this.state.orderData]
    const index = newData.findIndex((item) => record.key === item.key)
    let item = newData[index]

    item.productList[row.key] = {
      ...row,
      note: row.node || '---',
      code: row.code,
      name: row.name,
      price: Number(row.price),
      priceAfterFee: this.convertPriceAfterFee(Number(row.price)) || 0,
      count: Number(row.count),
      soldNumberProduct: Number(row.soldNumberProduct) || 0,
      remainNumberProduct: Number(row.count) - Number(row.soldNumberProduct || 0),
      moneyBackProduct: (Number(row.soldNumberProduct || 0) * Number(row.priceAfterFee))
    }

    let newRemainNumConsignment = 0
    let newmoneyBack = 0
    let newNumSoldConsignment = 0
    let newNumberOfProducts = 0

    item.productList.map((productItem, productItemIndex) => {
      item.productList[productItemIndex].note = item.productList[productItemIndex].note || '---'
      newNumberOfProducts += Number(productItem.count) || 0
      newRemainNumConsignment += Number(productItem.remainNumberProduct) || 0
      newmoneyBack += Number(productItem.soldNumberProduct) * Number(productItem.priceAfterFee) * 1000 || 0
      newNumSoldConsignment += Number(productItem.soldNumberProduct) || 0
    })

    const newItem = {
      ...item,
      numberOfProducts: newNumberOfProducts,
      remainNumConsignment: newRemainNumConsignment,
      moneyBack: Math.round(newmoneyBack),
      numSoldConsignment: newNumSoldConsignment
    }

    console.log('handleSaveNestTable')
    console.log(newItem)
    console.log(newData)

    // if (!isEqual(newItem, item)) {
    newData.splice(index, 1, newItem)
    console.log('row')
    this.setState({
      orderData: newData
    }, async () => {
      console.log(newItem)
      const res = await GapService.updateConsignment(newItem)
      console.log(res)
      if (res) {
        showNotification(`Cập nhật thành công ${item.phoneNumber}`)
      } else {
        showNotification(`Cập nhật chưa được`)
      }
    })
    // }
  };

  onDeleteButton = async (row) => {
    const newData = [...this.state.orderData]
    const index = newData.findIndex((item) => row.objectId === item.objectId)
    const item = newData[index]
    console.log(item)

    const res = await GapService.deleteOrder(row.objectId)
    console.log(res)
    if (res) {
      newData.splice(index, 1)
      this.setState({
        orderData: newData
      })
      showNotification(`Xoá thành công`)
      // showNotification(`Xoá thành công ${item.consignment}`)
    } else {
      showNotification(`Xoá chưa được`)
    }
  }

  fetchAllTags = async () => {
    const thisMonth = moment().get('month') + 1
    const thisYear = moment().get('year')
    this.setState({
      fromDateMoment: moment(`$${thisYear}-${thisMonth}-01`),
      toDateMoment: moment(`$${thisYear}-${thisMonth}-01`).add(1, 'month'),
      isLoadingTags: false
    }, () => this.fetchTableData())
  }

  convertPriceAfterFee = (productPrice = 0) => {
    let moneyBackForFullSold = productPrice

    if (productPrice > 0) {
      if (productPrice < 1000) {
        moneyBackForFullSold = productPrice * 74 / 100
      } else if (productPrice >= 1000 && productPrice <= 10000) {
        moneyBackForFullSold = productPrice * 77 / 100
      } else if (productPrice > 10000) {
        moneyBackForFullSold = productPrice * 80 / 100
      }

      return moneyBackForFullSold
    } else {
      return 0
    }
  }

  fetchTableData = async (page = 1) => {
    const { selectedKeys, fromDateMoment, toDateMoment } = this.state
    this.setState({
      isLoadingData: true
    }, async () => {
      let res

      if (selectedKeys && selectedKeys.objectId) {
        res = await GapService.getOrder(page, selectedKeys, null, fromDateMoment, toDateMoment)
        console.log('getOrder', res)
        res.results = [res]
      } else if (selectedKeys && (
        selectedKeys.phoneNumber ||
        selectedKeys.fullName ||
        selectedKeys.isTransferMoneyWithBank ||
        selectedKeys.totalNumberOfProductForSale ||
        selectedKeys.isOnlineSale)) {
        res = await GapService.getOrder(page, selectedKeys, null, fromDateMoment, toDateMoment)
      } else {
        res = await GapService.getOrder(page, null, null, fromDateMoment, toDateMoment)
      }

      console.log('res')
      console.log(res)
      let orderData = []
      if (res && res.results) {
        res.results.map((item, indexItem) => {
          // console.log('indexItem')
          // console.log(item)
          orderData.push({
            key: indexItem,
            objectId: item.objectId,
            fullName: item?.fullName,
            consignmentId: item.consignmentId,
            consignerIdCard: item.consignerIdCard,
            consigneeName: item.consigneeName,
            phoneNumber: item?.phoneNumber,
            totalNumberOfProductForSale: `${Number(item.totalNumberOfProductForSale)}`,
            isTransferMoneyWithBank: item.isTransferMoneyWithBank ? 'Chuyển khoản' : 'Trực tiếp',
            transferBankMoneyAmount: item.transferBankMoneyAmount || '---',
            transferOfflineMoneyAmount: item.transferOfflineMoneyAmount || '---',
            totalMoneyForSale: item.totalMoneyForSale ? `${item.totalMoneyForSale}` : 0,
            totalMoneyForSaleAfterFee: (item.totalMoneyForSaleAfterFee ? `${item.totalMoneyForSaleAfterFee}` : `${this.convertPriceAfterFee(item.totalMoneyForSaleAfterFee)}`) || 0,
            createdAt: moment(item.createdAt).format('DD-MM-YYYY hh:mm'),
            note: item.note || '---',
            isOnlineSale: item.isOnlineSale ? 'Online' : 'Offline',
            shippingInfo: item.shippingInfo,
            clientInfo: item.clientInfo || item.client,
            transporter: item.transporter,

            // numSoldConsignment: `${Number(item.numSoldConsignment || 0)}`,
            // remainNumConsignment: `${Number(item.numberOfProducts) - Number(item.numSoldConsignment || 0)}`,
            // bankName: item.banks && item.banks[0] ? item.banks[0].type : '',
            // bankId: item.banks && item.banks[0] ? item.banks[0].accNumber : '',
            moneyBackForFullSold: item.moneyBackForFullSold ? `${item.moneyBackForFullSold}` : 0,
            // totalMoney: item.totalMoney ? `${item.totalMoney}` : 0,
            timeConfirmGetMoney: item.timeConfirmGetMoney || moment(item.timeConfirmGetMoney).format('DD-MM-YYYY hh:mm'),
            // email: item.mail,
            // birthday: item.birthday,
            productList: item.productList,
            isGetMoney: item.isOnlineSale ? (item.isGetMoney || false) : true
          })
        })
        this.setState({
          currentPagination: page || 1,
          total: res.count,
          orderData: orderData,
          isLoadingData: false
        })
      } else {
        this.setState({
          isLoadingData: false
        })
      }
    })
  }

  handleSave = (row) => {
    const newData = [...this.state.orderData]
    const index = newData.findIndex((item) => row.key === item.key)
    const item = newData[index]
    // const newRemainNumConsignment = `${Number(row.numberOfProducts) - Number(row.numSoldConsignment || 0)}`
    const newItem = { ...item, ...row }

    if (!isEqual(newItem, item)) {
      newData.splice(index, 1, newItem)
      // console.log('row')
      this.setState({
        orderData: newData
      }, async () => {
        // console.log(newItem)
        const res = await GapService.updateConsignment(newItem)
        // console.log(res)
        if (res) {
          showNotification(`Cập nhật thành công ${item.phoneNumber}`)
        } else {
          showNotification(`Cập nhật chưa được`)
        }
      })
    }
  };

  paginationChange = (page) => {
    this.setState({
      currentPagination: page || 1
    }, () => {
      this.fetchTableData(page)
    })
  }

  onChangeTab = (tabKey) => {
    const { allInfoTag } = this.state
    this.setState({
      // selectedKeys: {},
      currentPagination: 1,
      currentTag: allInfoTag[tabKey].objectId
    }, () => {
      this.fetchTableData(1)
    })
  }

  onHandleDatePicker = (date, dateString) => {
    this.setState({
      fromDateMoment: date[0],
      toDateMoment: date[1],
      isLoadingTags: false
    }, () => this.fetchTableData())
  }

  // fetcDefaultLabel = async () => {
  //   const labelBas64 = await GapService.getLabelTransform()
  //   console.log('labelBas64', labelBas64)
  //   // const img = dataURLToBlob(labelBas64.result)
  //   const base64String = `data:application/pdf;base64,${labelBas64}`
  //   // console.log('labelBas64', labelBas64)
  //   // const blob = base64toBlob(base64String)
  //   // const url = URL.createObjectURL(blob)
  //   if (labelBas64) {
  //     setBase64(labelBas64.result)
  //   }
  // }

  render () {
    const { userData } = this.props
    const { isLoadingData, orderData, total, isLoadingTags, currentPagination, fromDateMoment, toDateMoment } = this.state

    const components = {
      body: {
        row: EditableRow,
        cell: EditableCell
      }
    }

    const columns = this.columns.map((col) => {
      if (!col.editable) {
        return col
      }

      return {
        ...col,
        onCell: (record) => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave
        })
      }
    })

    return (
      <div className='tableConsignemntScreen-container'>
        {/* {
          isLoadingTags ? <LoadingOutlined />
            : <Tabs defaultActiveKey='0' onChange={this.onChangeTab} >
              {allInfoTag.map((tag, indexTag) => <TabPane tab={tag.code} key={`${indexTag}`} />)}
            </Tabs>
        } */}
        <RangePicker value={[fromDateMoment, toDateMoment]} onChange={this.onHandleDatePicker} />
        <Button style={{ marginLeft: 10 }} onClick={this.onRefeshPage}>Cập nhật</Button>
        {/* <RangePicker value={[moment(), moment().add(1, 'month')]} defaultPickerValue={[moment(), moment().add(1, 'month')]} picker='month' onChange={this.onHandleDatePicker} /> */}
        <Table
          components={components}
          size='small'
          loading={isLoadingData || isLoadingTags}
          columns={columns}
          dataSource={orderData}
          bordered
          expandable={{ expandedRowRender: record => this.expandedRowRender(record) }}
          pagination={{
            current: currentPagination,
            total: total,
            pageSize: 100,
            onChange: this.paginationChange
          }}
          scroll={{ x: 1700, y: '70vh' }}
        />

        <MyModal ref={this.myModal} />
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  locale: state.locale,
  userData: state.userData
})

export default withRouter(connect(mapStateToProps, null)(TableOrderScreen))
