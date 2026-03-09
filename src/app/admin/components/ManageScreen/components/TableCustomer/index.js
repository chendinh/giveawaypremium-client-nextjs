/* eslint-disable react/display-name */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { withRouter } from 'next/router'
import { connect } from 'react-redux'
import { Form, Row, Col, Layout, Input, Button, Spin, Descriptions, Tabs, Table, Radio, Popconfirm } from 'antd'
import { images } from 'config/images'
import MyModal from 'pages/Components/MyModal'
import { showNotification, numberWithCommas } from 'common/function'
import { LoadingOutlined,  SearchOutlined } from '@ant-design/icons'
import { Router } from 'common/routes'
import { isMobile } from 'react-device-detect'
import './style.scss'
import Lottie from 'react-lottie'
import GapService from 'controller/Api/Services/Gap'
import { isEqual } from 'lodash'
import moment from 'moment'
import Highlighter from 'react-highlight-words'

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

class TableConsignemntScreen extends React.PureComponent {
  constructor (props) {
    super(props)
    this.columns = [
      {
        title: 'Tên khách hàng',
        width: 15,
        dataIndex: 'fullName',
        key: 'fullName',
        editable: true
      },
      {
        title: 'Số điện thoại',
        dataIndex: 'phoneNumber',
        key: 'phoneNumber',
        width: 10,
        editable: true,
        ...this.getColumnSearchProps('phoneNumber')
      },
      {
        title: 'Mail',
        dataIndex: 'email',
        key: 'email',
        width: 15,
        editable: true
      },
      {
        title: 'Sinh nhật',
        dataIndex: 'birthday',
        key: 'birthday',
        width: 10
      },
      {
        title: 'CMND',
        dataIndex: 'identityNumber',
        key: 'identityNumber',
        width: 10,
        editable: true
      },
      {
        title: 'Ngân hàng',
        dataIndex: 'bankName',
        key: 'bankName',
        width: 10,
        editable: true
      },
      {
        title: 'ID Ngân hàng',
        dataIndex: 'bankId',
        key: 'bankId',
        width: 10,
        editable: true
      },
      {
        title: 'Tổng tiền đã mua',
        dataIndex: 'totalMoneyForSale',
        key: 'totalMoneyForSale',
        width: 15
      },
      {
        title: 'Tổng sản phẩm đã mua',
        dataIndex: 'totalProductForSale',
        key: 'totalProductForSale',
        width: 10
      },
      {
        title: 'Tổng số lần mua sắm',
        dataIndex: 'numberOfSale',
        key: 'numberOfSale',
        width: 10
      }
      // {
      //   title: 'Nhận tiền',
      //   key: '7',
      //   fixed: 'right',
      //   width: 5,
      //   render: (value) =>
      //     this.state.customerData.length >= 1 ? (
      //       <Popconfirm title='Xác nhận' onConfirm={() => this.onChangeRadioIsGetMoney(value)}>
      //         <Radio.Button className={value.isGetMoney ? 'radio-true-isGetMoney' : 'radio-false-isGetMoney'} value={value.isGetMoney}>{value.isGetMoney ? 'Rồi' : 'Chưa'}</Radio.Button>
      //       </Popconfirm>
      //     ) : null
      // }
    ]
    this.state = {
      customerData: [],
      total: 0,
      page: 1,
      searchText: '',
      searchedColumn: ''
    }
    this.myModal = React.createRef()
  }

  componentDidMount () {
    this.fetchTableData()
  }

  componentDidUpdate () {

  }

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node
          }}
          placeholder={`Tìm số điện thoại`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        {/* <Space> */}
        <Button
          type='primary'
          onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          icon={<SearchOutlined />}
          size='small'
          style={{ width: '100%' }}
        >
            Tìm kiếm
        </Button>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select(), 100)
      }
    },
    render: text =>
      this.state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      )
  });

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    console.log('handleSearch')
    console.log(selectedKeys)

    // confirm()
    // this.fetchTableData(1, selectedKeys[0])
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex
    }, () => {
      confirm()
    })
  };

  onChangeRadioIsGetMoney = async (row) => {
    console.log('onChangeRadioIsGetMoney')
    console.log(row)

    const newData = [...this.state.customerData]
    const index = newData.findIndex((item) => row.objectId === item.objectId)
    const item = newData[index]
    const newItem = { ...item, ...row }

    if (!isEqual(newItem, item)) {
      newData.splice(index, 1, newItem)
      console.log('row')
      this.setState({
        customerData: newData
      }, async () => {
        console.log(newItem)
        const res = await GapService.updateCustomerTable(newItem)
        console.log(res)
        if (res) {
          showNotification(`Cập nhật thành công ${item.phoneNumber}`)
        } else {
          showNotification(`Cập nhật chưa được`)
        }
      })
    }
  }

  fetchTableData = async (page = 1) => {
    const { searchText } = this.state

    this.setState({
      isLoadingData: true
    }, async () => {
      let res
      if (!searchText) {
        res = await GapService.getCustomerTable(page)
      } else {
        res = await GapService.getCustomerTable(page, searchText)
      }

      let customerData = []
      if (res && res.results) {
        res.results.map((item, indexItem) => {
          console.log(item)
          customerData.push({
            key: indexItem,
            objectId: item.objectId,
            fullName: item.fullName,
            identityNumber: item.identityNumber,
            phoneNumber: item.phoneNumber,
            bankName: item.banks[0].type,
            bankId: item.banks[0].accNumber,
            email: item.mail,
            birthday: item.birthday,
            totalMoneyForSale: item.totalMoneyForSale ? `${numberWithCommas(item.totalMoneyForSale)},000vnđ` : 0,
            totalProductForSale: item.totalProductForSale || '--',
            numberOfSale: item.numberOfSale || '--'
          })
        })
        this.setState({
          total: res.count,
          customerData: customerData,
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
    const newData = [...this.state.customerData]
    const index = newData.findIndex((item) => row.key === item.key)
    const item = newData[index]
    const newItem = { ...item, ...row }

    if (!isEqual(newItem, item)) {
      newData.splice(index, 1, newItem)
      console.log('row')
      this.setState({
        customerData: newData
      }, async () => {
        console.log(newItem)
        const res = await GapService.updateCustomerTable(newItem)
        console.log(res)
        if (res) {
          showNotification(`Cập nhật thành công ${item.phoneNumber}`)
        } else {
          showNotification(`Cập nhật chưa được`)
        }
      })
    }
  };

  paginationChange = (page) => {
    console.log(page)
    this.fetchTableData(page)
  }

  render () {
    const { userData } = this.props
    const { isLoadingData, customerData, total } = this.state

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
        <Table
          components={components}
          size='small'
          loading={isLoadingData}
          columns={columns}
          dataSource={customerData}
          bordered
          pagination={{
            total: total,
            pageSize: 100,
            onChange: this.paginationChange
          }}
          scroll={{ x: 1600, y: '65vh' }}
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

export default withRouter(connect(mapStateToProps, null)(TableConsignemntScreen))
