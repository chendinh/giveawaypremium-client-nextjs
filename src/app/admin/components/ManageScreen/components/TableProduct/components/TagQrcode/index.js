import React from 'react'
import styled from 'styled-components'
import './styles.scss'
import moment from 'moment'
import { numberWithCommas } from 'common/function'
import QRCode from 'qrcode'

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

export default class TagOrcode extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: true,
      svg: null
    }
  }

  componentDidMount () {
    this.getQrcode()
  }

  formatQRCodeImage = async (data) => {
    let result = ''
    const dataString = await QRCode.toString(data, { margin: 0, type: 'svg', width: '10mm', height: '10mm' })
    if (typeof dataString === 'string') {
      result = dataString.replace('<svg', `<svg style={{ widht: '10mm', height: '10mm' }} class="walletconnect-qrcode__image"`)
    }
    return result
  }

  getQrcode = async () => {
    const { data } = this.props
    this.setState({
      isLoading: true
    })
    const svg = (await this.formatQRCodeImage(data.code))
    this.setState({
      svg: svg,
      isLoading: false
    })
  }

  render () {
    const { data = {} } = this.props
    const { svg } = this.state
    // console.log('data', data)

    const customNameProduct = (`${data.name} 123213 123213`).length > 55 ? `${`${data.name} 123213 123213`.slice(0, 55)}...` : data?.name ? data.name : '---'

    return (
      <div className={'BoxContainerTag'}>
        <div className='qrcode' id='qrcode'>
          <style type='text/css' media='print'>
            {/* {'\
              @page { size: portrait; }\
            '} */}
          </style>
          <div className='leftBox'>
            <p className='leftBoxCode'>{data.code}</p>
            <div className='qrcodeImgBox' dangerouslySetInnerHTML={{ __html: svg }} />
          </div>

          <div className='rightBox'>
            <span className='rightBoxName'>{customNameProduct}</span>

            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <span className='rightBoxNewUsed'>({(data.isNew === 'new' || data.rateNew === 100) ? 'NEW' : 'USED'})</span>
              <span className='price'>{numberWithCommas(data.price * 1000)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
export const FunctionalComponentToPrint = React.forwardRef((props, ref) => {
  // eslint-disable-line max-len
  return <TagOrcode ref={ref} text={props.text} />
})
