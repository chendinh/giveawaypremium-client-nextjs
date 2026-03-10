/* eslint-disable react/display-name */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { withRouter } from 'next/router'
import { connect } from 'react-redux'
import { Form, Row, Col, Layout, Input, Button, Badge, Spin, Descriptions, Tabs, Table, Radio, Popconfirm, Upload, Switch } from 'antd'
import { images } from 'config/images'
import MyModal from 'pages/Components/MyModal'
import { showNotification, numberWithCommas, randomString } from 'common/function'
import { DeleteFilled, LeftCircleTwoTone, LoadingOutlined, PrinterOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { Router } from 'common/routes'
import { isMobile } from 'react-device-detect'
import './style.scss'
import Lottie from 'react-lottie'
import GapService from 'controller/Api/Services/Gap'
import { isEqual } from 'lodash'
import Highlighter from 'react-highlight-words'
import { EMAIL_TITLE, EMAIL_TYPE } from 'common/constants'
import moment from 'moment'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import TagOrcode from './components/TagQrcode'
import ReactToPrint from 'react-to-print'
import QRCode from 'qrcode'
import TagPrintBox from './components/TagPrintBox'
import { PrintOutlined } from '@material-ui/icons'
import styled from 'styled-components'
import TagPrintBoxMulti from './components/TagPrintBoxMulti'
import CloudinaryUploadWidget from './CloudinaryUploadWidget'
import { Cloudinary } from '@cloudinary/url-gen'
import { AdvancedImage, responsive, placeholder } from '@cloudinary/react'

const cld = new Cloudinary({
  cloud: {
    cloudName: 'hzxyensd5'
  }
})

// import * as arrayMove from 'array-move'
const { Dragger } = Upload

const { TabPane } = Tabs
let isJPG = false
let isLt2M = false
let isLt10M = false

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

class TableProductScreen extends React.PureComponent {
  constructor (props) {
    super(props)
    this.columns = [
      {
        title: () => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className='MR10'>Code SP</span>
            <div>
              <Button onClick={() => this.onShowPrintAll()}>{!this.state.isShowMultiPrintView ? `In Tất Cả` : 'Đóng In Tất Cả'}</Button>
            </div>
          </div>
        ),
        // dataIndex: 'code',
        key: 'code',
        width: 350,
        render: (value) => <TagPrintBox data={value} />,
        ...this.getColumnSearchKeyProps('code')
      },
      {
        title: 'SL TAG IN',
        dataIndex: 'numberTagCount',
        key: 'numberTagCount',
        width: 120,
        editable: true
      },
      {
        title: 'Tên SP',
        dataIndex: 'name',
        key: 'name',
        width: 150,
        ...this.getColumnSearchKeyProps('name')
      },
      {
        title: 'Giá',
        dataIndex: 'price',
        key: 'price',
        width: 150,
        // editable: true,
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      },
      {
        title: 'Giá sau phí',
        dataIndex: 'priceAfterFee',
        key: 'priceAfterFee',
        width: 150,
        // editable: true,
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      },
      {
        title: 'Số lượng',
        dataIndex: 'count',
        key: 'count',
        width: 100
      },
      {
        title: 'Đã bán',
        width: 100,
        dataIndex: 'soldNumberProduct',
        key: 'soldNumberProduct'
        // ...this.getColumnSearchKeyProps('soldNumberProduct')
        // editable: true
      },
      {
        title: 'Còn lại',
        width: 100,
        dataIndex: 'w',
        key: 'remainNumberProduct',
        ...this.getColumnSearchKeyProps('remainNumberProduct')
      },
      {
        title: 'Tổng tiền sau phí',
        dataIndex: 'moneyBackProduct',
        width: 150,
        key: 'moneyBackProduct',
        render: (value) => <span>{value ? numberWithCommas(value * 1000) : '0'} đ</span>
      },
      {
        title: 'Loại',
        dataIndex: 'category',
        width: 200,
        key: 'category',
        render: (value) => <span>{value}</span>
      },
      {
        title: 'Tình trạng',
        dataIndex: 'status',
        width: 95,
        fixed: 'right',
        key: 'status',
        render: (value, item) => <Switch onClick={() => this.onChangeStatusItem(item)} checkedChildren='ONLINE' unCheckedChildren='OFFLINE' checked={value === 'ACTIVE'} />
      }
    ]
    this.state = {
      productData: [],
      total: 0,
      page: 1,
      searchText: '',
      selectedKeys: {},
      searchedColumn: '',
      tabKey: '1',
      isLoadingTags: false,
      tags: [],
      allInfoTag: [],
      currentTag: '',
      mediaImage: [],
      imageUrl: false,
      isUploading: false,
      currentPagination: 1,
      isShowMultiPrintView: false,
      loadedWitget: false
    }
    this.myModal = React.createRef()
    this.componentRef = React.createRef()
    this.loaded = false
  }

  componentDidMount () {
    this.fetchAllTags()
    if (!this.state.loadedWitget) {
      const uwScript = document.getElementById('uw')
      if (!uwScript) {
        // If not loaded, create and load the script
        const script = document.createElement('script')
        script.setAttribute('async', '')
        script.setAttribute('id', 'uw')
        script.src = 'https://upload-widget.cloudinary.com/global/all.js'
        script.addEventListener('load', () => this.setState({
          loadedWitget: true
        }))
        document.body.appendChild(script)
      } else {
        // If already loaded, update the state
        this.setState({
          loadedWitget: true
        })
      }
    }
  }

  componentDidUpdate () {

  }

  onShowPrintAll = () => {
    console.log('onPrintAll')
    this.setState({
      isShowMultiPrintView: !this.state.isShowMultiPrintView
    })
  }

  convertStatusNumberToText = (statusNumber) => {
    switch (statusNumber) {
    case 'NEW': {
      return 'OFFLINE'
    }
    case 'ACTIVE': {
      return 'ONLINE'
    }
    }
  }

  onChangeStatusItem = (record) => {
    console.log('onChangeStatusItem')
    console.log(record)

    let newStatus
    if (record.status === 'NEW') {
      newStatus = 'ACTIVE'
    } else if (record.status === 'ACTIVE') {
      newStatus = 'NEW'
    }

    const newData = [...this.state.productData]
    console.log('productData')
    console.log(this.state.productData)
    const index = newData.findIndex((item) => record.key === item.key)
    let item = newData[index]

    item = {
      ...record,
      status: newStatus
    }

    const newItem = { ...item, status: newStatus }

    console.log('handleSaveNestTable')
    console.log(newItem)

    // if (!isEqual(newItem, item)) {
    newData.splice(index, 1, newItem)
    console.log(newData)
    console.log('newData')

    this.setState({
      productData: newData
    }, async () => {
      console.log(newItem)
      const res = await GapService.updateProduct(newItem)
      console.log(res)
      if (res) {
        showNotification(`Cập nhật thành công ${item.key}`)
      } else {
        const newItem = { ...item, status: record.status }
        newData.splice(index, 1, newItem)

        this.setState({
          productData: newData
        })

        showNotification(`Cập nhật chưa được`)
      }
    })
  }

  onSortEnd = async ({ information, recordData }) => {
    const { productData } = this.state
    const newData = [...productData]
    console.log(newData)

    this.setState({
      isUploading: true
    }, async () => {
      const index = newData.findIndex((foundItem) => recordData.key === foundItem.key)
      let newItem = newData[index]
      let newItemForUploading
      let originItem = { ...newItem }

      console.log('onSortEnd')
      console.log(information.oldIndex)
      console.log(information.newIndex)

      console.log(recordData)
      console.log(newItem)

      if (information.oldIndex !== information.newIndex) {
        let newImageList = [...newItem.medias]
        let imageTempOld = newImageList[information.oldIndex]
        newImageList.splice(information.oldIndex, 1)
        newImageList.splice(information.newIndex, 0, imageTempOld)

        newItemForUploading = {
          ...newItem,
          medias: newImageList
        }
        newItem.medias = newImageList
      } else {
        this.setState({
          isUploading: false
        })
        return
      }

      newData[index] = newItem
      this.setState({
        productData: newData
      })

      const resPro = await GapService.updateProduct(newItemForUploading)
      if (resPro) {
        this.setState({
          isUploading: false
        })
        showNotification(`Thay đổi thành công ${newItem.objectId}`)
      } else {
        newData[index] = originItem
        this.setState({
          productData: newData,
          isUploading: false
        })
        showNotification(`Thay đổi chưa thành công ${newItem.objectId}`)
      }
    })
  };

  removePhoto = async (item, recordData, indexPhoto) => {
    const { productData } = this.state
    this.setState({
      isUploading: true
    }, async () => {
      const newData = [...productData]
      console.log(newData)

      const index = newData.findIndex((foundItem) => recordData.key === foundItem.key)
      let newItem = newData[index]
      console.log(index)

      let newItemForUploading

      console.log(newData)
      console.log(newItem)

      if (newItem.medias && newItem.medias.length > 1) {
        let newImageList = [...newItem.medias]
        newImageList = newImageList.filter((newItemRemain) => {
          return newItemRemain.objectId !== item.objectId
        })

        newItemForUploading = {
          ...newItem,
          medias: newImageList
        }
        newItem.medias = newImageList
      } else {
        newItemForUploading = {
          ...newItem,
          medias: []
        }
        newItem.medias = []
      }

      const resPro = await GapService.updateProduct(newItemForUploading)
      if (resPro) {
        newData[index] = newItem
        this.setState({
          productData: newData,
          isUploading: false
        })
        showNotification(`Xoá thành công ${newItem.objectId}`)
      } else {
        this.setState({
          isUploading: false
        })
        showNotification(`Xoá chưa thành công ${newItem.objectId}`)
      }
    })
  }

  action = (a) => {
    console.log('action log', a)
  }

  handleUpload = async (info, recordData) => {
    const { productData, isUploading } = this.state
    const status = info.file.status

    if (status !== 'uploading') {
      // console.log('handleUpload uploading')
      // console.log(info.file, info.fileList)
    }
    if (status === 'done') {
      this.setState({
        isUploading: true
      }, async () => {
        const newData = [...productData]
        const index = newData.findIndex((item) => recordData.key === item.key)
        let newItem = newData[index]
        let newItemForUploading

        console.log('info', info)

        const res = await GapService.uploadSingleFileWithFormData(info.file)
        console.log('res', res)
        const newImage = { '__type': 'Pointer', 'className': 'Media', 'objectId': res.objectId }

        if (newItem.medias && newItem.medias.length > 0) {
          newItemForUploading = {
            ...newItem,
            medias: [
              ...newItem.medias,
              newImage
            ]
          }
          newItem.medias = [
            ...newItem.medias,
            { ...newImage, data: res.data }
          ]
        } else {
          newItemForUploading = {
            ...newItem,
            medias: [
              newImage
            ]
          }
          newItem.medias = [
            { ...newImage, data: res.data }
          ]
        }

        const resPro = await GapService.updateProduct(newItemForUploading, true)
        if (resPro) {
          newData[index] = newItem
          this.setState({
            productData: newData,
            isUploading: false
          })
          showNotification(`Cập nhật thành công ${newItem.objectId}`)
        } else {
          this.setState({
            isUploading: false
          })
          showNotification(`Cập nhật chưa thành công ${newItem.objectId}`)
        }
      })
    } else if (status === 'error') {
      this.setState({
        isUploading: false
      })
      showNotification(`Cập nhật chưa thành công`)
    }
  }

  handleUploadv2 = async (info, recordData) => {
    const { productData, isUploading } = this.state

    try {
      this.setState({
        isUploading: true
      }, async () => {
        const newData = [...productData]
        const index = newData.findIndex((item) => recordData.key === item.key)
        let newItem = newData[index]
        let newItemForUploading

        console.log('info', info)

        const res = await GapService.setMedia(info)
        console.log('res', res)
        const newImage = { '__type': 'Pointer', 'className': 'Media', 'objectId': res.objectId }

        if (newItem.medias && newItem.medias.length > 0) {
          newItemForUploading = {
            ...newItem,
            medias: [
              ...newItem.medias,
              newImage
            ]
          }
          newItem.medias = [
            ...newItem.medias,
            { ...newImage, data: info }
          ]
        } else {
          newItemForUploading = {
            ...newItem,
            medias: [
              newImage
            ]
          }
          newItem.medias = [
            { ...newImage, data: info }
          ]
        }

        const resPro = await GapService.updateProduct(newItemForUploading, true)
        if (resPro) {
          newData[index] = newItem
          this.setState({
            productData: newData,
            isUploading: false
          })
          showNotification(`Cập nhật thành công ${newItem.objectId}`)
        } else {
          this.setState({
            isUploading: false
          })
          showNotification(`Cập nhật chưa thành công ${newItem.objectId}`)
        }
      })
    } catch (e) {
      this.setState({
        isUploading: false
      })
    } finally {
      this.setState({
        isUploading: false
      })
    }
  }

  // [{"__type":"Pointer","className":"Media","objectId":"vu0vN7mImh"},

  data = async (file) => {
    console.log('data file', file)
    return file
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
        (this.state.selectedKeys?.name?.length > 0 && keyColumn === 'name') ||
        (this.state.selectedKeys?.code?.length > 0 && keyColumn === 'code') ||
        (this.state.selectedKeys?.soldNumberProduct?.length > 0 && keyColumn === 'soldNumberProduct') ||
        (this.state.selectedKeys?.remainNumberProduct?.length > 0 && keyColumn === 'remainNumberProduct')
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

  expandedRowRender = (recordData) => {
    const { isUploading } = this.state
    const components = {
      body: {
        row: EditableRow,
        cell: EditableCell
      }
    }

    const SortableItem = SortableElement(({ item, indexItem }) => (
      <div className='inner-item' key={indexItem}>
        <div
          className='photo-remove-icon'
          onClick={() => this.removePhoto(item, recordData, indexItem)}
        >
          <img src={images.icClose} alt='remove' />
        </div>
        <img
          defaultValue={images.aLogoBlack}
          src={item?.data?.secure_url}
          style={{ maxWidth: '70px', height: '70px', objectFit: 'contain' }}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null // prevents looping
            currentTarget.src = images.aLogoBlack
          }}
        />
      </div>
    ))

    const SortableList = SortableContainer(({ items }) => (
      <div className='SortableList-container'>
        {items && items.length > 0 && items.map((item, index) => (
          <SortableItem
            pressDelay={0}
            key={`${index}`}
            indexItem={index}
            index={index}
            item={item}
          />
        ))}
      </div>
    ))

    const columns = [
      {
        title: 'Ảnh',
        dataIndex: 'medias',
        key: 'medias',
        // editable: true,
        width: 300,
        render: (value) => {
          return (
            <div>
              <div className='upload-Dragger-container'>
                <SortableList
                  items={value}
                  onSortEnd={(information) => this.onSortEnd({ information, recordData })}
                  pressDelay={250}
                  axis='xy'
                  helperClass='SortableHelper'
                />

                {
                  value && value.length >= 5 ? null
                    : (
                    // <Dragger
                    //   beforeUpload={this.action}
                    //   withCredentials
                    //   name='uploadFile'
                    //   listType='picture-card'
                    //   action={this.action}
                    //   showUploadList={false}
                    //   onChange={(info) => this.handleUpload(info, recordData)}
                    //   multiple
                    //   maxCount={5}
                    //   maxLength={5}
                    //   accept='.png,.jpg,.jpeg,.gif'
                    //   className='upload-Dragger'
                    //   style={value && value.length === 0 && { border: 'none', background: 'transparent' }}
                    // >
                    //   <input type='file' id='myFile' name='filename' />
                    //   {
                    //     value && value.length === 0
                    //       ? <Button>
                    //         <UploadOutlined /> Thêm ảnh
                    //       </Button> : <div>
                    //         <p className='ant-upload-text'>
                    //           {isUploading ? (
                    //             <LoadingOutlined />
                    //           ) : (
                    //             <img src={images.increase} />
                    //           )}
                    //         </p>
                    //       </div>
                    //   }
                    // </Dragger>
                      this.state.loadedWitget && (
                        <CloudinaryUploadWidget
                          uwConfig={{
                            cloudName: 'hzxyensd5',
                            uploadPreset: 'aoh4fpwm',
                            multiple: false,
                            maxImageFileSize: 2000000,
                            maxImageWidth: 600,
                            cropping: true,
                            isShowing: true
                          }}
                          setPublicInfo={(info) => this.handleUploadv2(info, recordData)}
                        />
                      )
                    )

                }

              </div>
              <div className='nft-message-length'>
                {value ? value.length : 0}/5
              </div>
            </div>
          )
        }
      },
      {
        title: 'Size',
        dataIndex: 'sizeInfo',
        key: 'sizeInfo',
        width: 80,
        editable: true,
        render: (value) => <span>{value}</span>
      },
      {
        title: 'Độ mới',
        dataIndex: 'rateNew',
        key: 'rateNew',
        editable: true,
        width: 80,
        render: (value) => <span>{value}%</span>
      },
      {
        title: 'Chi tiết sản phẩm',
        width: 150,
        dataIndex: 'detailInfo',
        key: 'detailInfo',
        editable: true
      },
      {
        title: 'Ghi chú',
        width: 150,
        dataIndex: 'note',
        key: 'note',
        editable: true
      }
    ]

    const data = []

    console.log('item')
    console.log(recordData)

    data.push({
      key: recordData.objectId,
      medias: recordData.medias && recordData.medias.length > 0 ? recordData.medias : null,
      sizeInfo: recordData.sizeInfo || '-',
      rateNew: Number(recordData.rateNew) || 0,
      detailInfo: recordData.detailInfo || '-',
      note: recordData.note || '-'
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
      scroll={{ x: 1500, y: '55vh' }}
      components={components}
      columns={formatedColumns}
      dataSource={data}
      pagination={false}
    />
  };

  handleSaveNestTable = (row, record) => {
    console.log('row - handleSaveNestTable')
    console.log(row)
    console.log(record)

    const newData = [...this.state.productData]
    console.log('productData')
    console.log(this.state.productData)
    const index = newData.findIndex((item) => record.key === item.key)
    let item = newData[index]

    item = {
      ...record,
      ...row,
      sizeInfo: row.sizeInfo || '--',
      note: row.note || '--',
      rateNew: row.rateNew || 0,
      detailInfo: row.detailInfo || '--'
    }

    const newItem = { ...item, objectId: record.objectId }

    console.log('handleSaveNestTable')
    console.log(newItem)

    // if (!isEqual(newItem, item)) {
    newData.splice(index, 1, newItem)
    console.log(newData)
    console.log('newData')

    this.setState({
      productData: newData
    }, async () => {
      console.log(newItem)
      const res = await GapService.updateProduct(newItem)
      console.log(res)
      if (res) {
        showNotification(`Cập nhật thành công ${item.key}`)
      } else {
        showNotification(`Cập nhật chưa được`)
      }
    })
  };

  fetchAllTags = async () => {
    this.setState({
      searchText: '',
      isLoadingTags: true
    }, async () => {
      const res = await GapService.getConsignmentID()
      if (res && res.results && res.results.length > 0) {
        const tempArray = res.results.reverse()
        this.setState({
          currentTag: tempArray[0].objectId,
          allInfoTag: tempArray,
          isLoadingTags: false
        }, () => this.fetchTableData())
      } else {
        this.setState({
          isLoadingTags: false
        })
      }
    })
  }

  fetchTableData = async (page = 1, keyword) => {
    const { searchText, currentTag, selectedKeys } = this.state
    this.setState({
      isLoadingData: true
    }, async () => {
      let res

      if (selectedKeys && (
        selectedKeys.name ||
        selectedKeys.code ||
        selectedKeys.soldNumberProduct ||
        selectedKeys.remainNumberProduct)) {
        res = await GapService.getProduct(page, selectedKeys, null, currentTag)
      } else {
        res = await GapService.getProduct(page, null, null, currentTag)
      }

      console.log('res')
      console.log(res)
      let productData = []
      if (res && res.results) {
        res.results.map((item, indexItem) => {
          let categoryType
          if (item.category && item.category.name && item.subCategory && item.subCategory.name) {
            categoryType = `${item.category.name} -> ${item.subCategory.name}`
          } else if (!item.subCategory || !item.subCategory.name) {
            categoryType = item.category.name
          }
          productData.push({
            ...item,
            key: item.objectId,
            category: categoryType,
            categoryId: item.category.objectId,
            price: Number(item.price) || 0,
            count: Number(item.count) || 0,
            priceAfterFee: Number(item.priceAfterFee) || 0,
            soldNumberProduct: Number(item.soldNumberProduct) || 0,
            remainNumberProduct: Number(item.count) - Number(item.soldNumberProduct || 0),
            numberTagCount: Number(item.count) - Number(item.soldNumberProduct || 0),
            moneyBackProduct: Math.round(Number(item.soldNumberProduct || 0) * item.priceAfterFee || 0)
          })
        })

        this.setState({
          currentPagination: page || 1,
          total: res.count,
          productData: productData,
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
    const newData = [...this.state.productData]
    const index = newData.findIndex((item) => row.key === item.key)
    const item = newData[index]
    // const newRemainNumConsignment = `${Number(row.numberOfProducts) - Number(row.numSoldConsignment || 0)}`
    const newItem = { ...item, ...row }
    console.log('row', row)

    if (!isEqual(newItem, item)) {
      newData.splice(index, 1, newItem)
      this.setState({
        productData: newData
      }, async () => {
        console.log(newItem)
        // if ()
        const res = await GapService.updateConsignment(newItem)
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

  render () {
    const { userData } = this.props
    const { isLoadingData, consignmentData, total, isLoadingTags, tags, allInfoTag, currentPagination, productData, isShowMultiPrintView } = this.state

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
        {
          isLoadingTags ? <LoadingOutlined />
            : <Tabs defaultActiveKey='0' onChange={this.onChangeTab} >
              {allInfoTag.map((tag, indexTag) => <TabPane tab={tag.code} key={`${indexTag}`} />)}
            </Tabs>
        }
        {
          productData && isShowMultiPrintView && (
            <>
              <Button className='MT15 MB15' onClick={() => this.onShowPrintAll()}>{!this.state.isShowMultiPrintView ? `In Tất Cả` : 'Đóng In Tất Cả'}</Button>
              <TagPrintBoxMulti productData={productData} />
            </>
          )
        }
        <Table
          components={components}
          size='small'
          loading={isLoadingData || isLoadingTags}
          columns={columns}
          dataSource={productData}
          bordered
          expandable={{ expandedRowRender: (record) => this.expandedRowRender(record) }}
          pagination={{
            current: currentPagination,
            total: total,
            pageSize: 100,
            onChange: this.paginationChange
          }}
          scroll={{ x: 1500, y: '70vh' }}
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

export default withRouter(connect(mapStateToProps, null)(TableProductScreen))
