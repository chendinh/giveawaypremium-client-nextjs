import React from 'react'
import styled from 'styled-components'
import './styles.scss'
import moment from 'moment'
import { numberWithCommas } from 'common/function'

// const BoxContainer = styled.div`
//   display: flex;
//   justify-content: center;

//   /* align-items: center;
//   flex-direction: column; */
//   font-size: 14px;
//   font-family: "courier";
//   /* background: #e6e6e6; */
//   width: 100%;
//   min-height: 100vh;

//   padding: 50px 0;
//   box-sizing: border-box;
// `

export default class ReceiptOffline extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = { checked: false }
  }
  render () {
    const { data = {} } = this.props
    const { productList = [] } = data
    // console.log('data', data)

    // console.log('productList', productList)

    return (
      <div className={'BoxContainer'}>
        <style type='text/css' media='print'>
          {'\
   @page { size: portrait; }\
'}
        </style>
        <div className={'BoxTicket'}>
          <div className={'BoxHeader'}>
            <p>GIVE AWAY PREMIUM QUẬN 1</p>
            <p style={{ marginBottom: '0px' }}>Địa chỉ: 01 Phó Đức Chính</p>
            <p>phường Nguyễn Thái Bình, Q1, HCM</p>
            {/* <p>phường Nguyễn Thái Bình, Q1</p> */}
            <p>Hotline: 0703.334.443</p>
            <p style={{ marginBottom: '0px' }}>Facebook: Give Away Premium Quận 1</p>
            <p>Instagram: @giveawaypremium_quan1</p>
          </div>
          <div className={'BoxContent'}>
            <div className={'BoxCol'}>
              <p>Mã đơn hàng:</p>
              <p>{data.objectIdOrder || '#'}</p>
            </div>
            <div className='BoxCol'>
              <p>Ngày:</p>
              <p>{moment().format('DD-MM-YYYY HH:mm:ss')}</p>
            </div>
            <table className='MainTable'>
              <tbody>
                <tr className='header'>
                  <td>#</td>
                  <td>Sản phẩm</td>
                  <td>SL</td>
                  <td>Tổng</td>
                </tr>
                {
                  productList && productList.map((item, itemIndex) => {
                    return (
                      <tr key={itemIndex} className='header'>
                        <td>{itemIndex + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.count}</td>
                        <td>{numberWithCommas(item.price || '0') || 0},000đ</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
            <table className='SubTable'>
              <tbody>
                <tr>
                  <th>Tổng sản phẩm:</th>
                  <td>{data.totalNumberOfProductForSale}</td>
                </tr>
                <tr>
                  <th>Tổng tiền:</th>
                  <td>{numberWithCommas(data.totalMoneyForSale || '0') || 0},000đ</td>
                </tr>
              </tbody>
            </table>
            <div className='LegalCopy'>
              <strong>Lưu ý:</strong>
              <p>
                  HÀNG ĐÃ MUA KHÔNG ĐỔI TRẢ
              </p>
              <p className='camon'>
              Cảm ơn và hẹn gặp lại quý khách!
              </p>
              <br />
              <br />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
export const FunctionalComponentToPrint = React.forwardRef((props, ref) => {
  // eslint-disable-line max-len
  return <ReceiptOffline ref={ref} text={props.text} />
})
