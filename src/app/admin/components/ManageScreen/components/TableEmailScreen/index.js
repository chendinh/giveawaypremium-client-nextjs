/* eslint-disable react/display-name */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { withRouter } from 'next/router'
import { connect } from 'react-redux'
import { Form, Row, Col, Layout, Input, Button, Spin, Descriptions, Tabs, Table, Radio, Popconfirm } from 'antd'
import { images } from 'config/images'
import MyModal from 'pages/Components/MyModal'
import { showNotification, numberWithCommas } from 'common/function'
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons'
import { Router } from 'common/routes'
import { isMobile } from 'react-device-detect'
import './style.scss'
import Lottie from 'react-lottie'
import GapService from 'controller/Api/Services/Gap'
import { isEqual } from 'lodash'
import moment from 'moment'
import Highlighter from 'react-highlight-words'
import TextArea from 'antd/lib/input/TextArea'
import dynamic from 'next/dynamic'

import 'react-quill/dist/quill.snow.css'

// const ReactQuill = typeof window === 'object' ? require('react-quill') : () => false
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
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
  isTextArea = false,
  isRequired = true,
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
    childNode = editing && !isTextArea ? (
      <Form.Item
        style={{
          margin: 0
        }}
        name={dataIndex}
        rules={[
          {
            required: isRequired,
            message: `${title} is required.`
          }
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : editing && isTextArea ? (
      <Form.Item
        style={{
          margin: 0
        }}
        name={dataIndex}
        rules={[
          {
            required: isRequired,
            message: `${title} is required.`
          }
        ]}
      >
        <TextArea style={{ height: '60vh', width: '600px' }} ref={inputRef} onPressEnter={save} onBlur={save} />
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

class TableEmailScreen extends React.PureComponent {
  constructor (props) {
    super(props)
    this.columns = [
      {
        title: 'KEY',
        width: 100,
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: 'HTML',
        width: 500,
        dataIndex: 'content',
        key: 'content',
        isTextArea: true,
        editable: true
      },
      {
        title: 'RENDER',
        width: 500,
        render: (item) => {
          if (item.content && typeof document !== 'undefined') {
            return (
              <ReactQuill
                readOnly
                theme='snow'
                value={item.content}
              />
            )
          } else {
            return null
          }
        }
      }
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

  fetchTableData = async (page = 1) => {
    const { searchText } = this.state

    this.setState({
      isLoadingData: true
    }, async () => {
      let res
      if (!searchText) {
        res = await GapService.getEmailTable(page)
      } else {
        res = await GapService.getEmailTable(page, searchText)
      }

      let customerData = []
      if (res && res.results) {
        res.results.map((item, indexItem) => {
          console.log(item)
          customerData.push({
            key: indexItem,
            objectId: item.objectId,
            content: item.content,
            name: item.key
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
        const res = await GapService.updateEmailTable(newItem.objectId, newItem.content)
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
          isTextArea: col.isTextArea,
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

export default withRouter(connect(mapStateToProps, null)(TableEmailScreen))
