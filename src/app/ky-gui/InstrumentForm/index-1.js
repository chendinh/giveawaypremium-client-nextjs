import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'next/router';
import MyModal from 'pages/Components/MyModal';
import moment from 'moment';
import { Col, Input, Button, Divider } from 'antd';
import { numberWithCommas } from 'common/function';

import './style.scss';
import { TramRounded } from '@material-ui/icons';

class ConsignmentScreen extends React.PureComponent {
  static async getInitialProps({ query }) {
    return { query };
  }
  constructor(props) {
    super(props);
    this.state = {
      isShowSectionOne: false,
      isShowSectionTwo: false,
    };
    this.myModal = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        isShowSectionOne: true,
        isShowSectionTwo: true,
        isErrorMin: false,
        moneyBack: '',
        moneySold: '',
      });
    }, 100);
  }

  componentDidUpdate() {}

  componentWillUnmount() {}

  changeData = e => {
    let moneyBack = 0;
    this.setState({
      moneySold: e.target.value,
    });
    if (e.target.value > 0) {
      if (e.target.value < 1000000) {
        moneyBack = (e.target.value * 74) / 100;
      } else if (e.target.value >= 1000000 && e.target.value <= 10000000) {
        moneyBack = (e.target.value * 77) / 100;
      } else if (e.target.value > 10000000) {
        moneyBack = (e.target.value * 80) / 100;
      }
      this.setState({
        moneyBack: moneyBack,
      });
    } else {
      this.setState({
        moneyBack: '',
      });
    }
  };

  backPageProps = () => {
    this.props.backConsignment();
  };

  render() {
    const { isShowSectionOne, moneyBack, moneySold } = this.state;

    return (
      <div className="instrument-container">
        <div className="home-page-wrapper">
          <div className="main-content radius-bottom">
            <div className="wrapper">
              <div
                className={
                  'box-content-introduce' + (isShowSectionOne ? ' show' : '')
                }
              >
                <h2 className="text text-center text-color-0 txt-big-intro MB60">
                  PHƯƠNG THỨC KÝ GỬI
                </h2>

                <div className="info-fee-box MB30">
                  <div className="info-fee-box-left">
                    <h2
                      style={{ opacity: 0, pointerEvents: 'none' }}
                      className="text text-left text-color-10 txt-small-intro MB15"
                    >
                      {'Danh mục'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro MB15">
                      {'Dưới 1 triệu'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro MB15">
                      {'Từ 1 đến 10 triệu'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro MB15">
                      {'Trên 10 triệu'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro">
                      {'Luxury / chủ Brand'}
                    </h2>
                  </div>

                  <div className="info-fee-box-right">
                    <h2 className="text text-left text-color-10 txt-small-intro MB15">
                      {'Phí Ký gửi:'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro MB15">
                      {'26%'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro MB15">
                      {'23%'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro MB15">
                      {'20%'}
                    </h2>
                    <h2 className="text text-left text-color-10 txt-small-intro ">
                      {'Thoả thuận'}
                    </h2>
                  </div>
                </div>
                <Col sm={24} md={10}>
                  <Input
                    suffix="vnđ"
                    value={moneySold}
                    type="number"
                    size="small"
                    allowClear
                    name="moneySold"
                    id="moneySold"
                    key="moneySold"
                    onChange={this.changeData}
                    placeholder="Nhập giá dự định ký gửi"
                  />
                </Col>
                <p className="MT10">
                  Số tiền sau khi đã trừ phí là:{' '}
                  {moneyBack ? numberWithCommas(moneyBack) : ''}
                </p>

                <Divider />
                <h2 className="text text-left text-color-10 txt-small-intro MB15">
                  {'Thời gian ký gửi: Từ 50-70 ngày và tuỳ đợt ký gửi.'}
                </h2>

                <h2 className="text text-left text-color-10 txt-small-intro MB15">
                  {
                    'Quy định nhận ký gửi: Số lượng tối thiểu 5 món hoặc tuỳ giá trị đơn hàng (sản phẩm cao cấp).'
                  }
                </h2>

                <h2 className="text text-left text-color-10 txt-small-intro MB15">{`*Tiêu chí ký gửi:
                  ⁃ Giá ký gửi là giá thanh lý. Lấy sức hút, tình trạng của sản phẩm tại thời điểm bán để làm tiêu chuẩn định giá thanh lý. Dựa trên 3 yếu tố chính: chất liệu, kiểu dáng, thương hiệu. 
                  ⁃ GAP chỉ nhận sản phẩm có thương hiệu (global/ local), authentic/ no fake, tình trạng mới từ 80%. 
                  ⁃ Mỹ phẩm còn date từ 6 tháng (GAP sẽ giúp bạn check date). 
                  ⁃ Không nhận: quần áo Quảng Châu, hàng không thương hiệu, hàng fake, mỹ phẩm hết date,…
                  `}</h2>
                <h2 className="text text-left text-color-10 txt-small-intro MB15">{`*Lưu ý khác:
                  ⁃ Sau khi được double check auth bởi CTV là chuyên viên đang làm việc tại Việt Nam và quốc tế, nếu phát hiện fake, GAP sẽ lưu kho và hoàn trả lại khi đến hẹn được ghi trên biên nhận ký gửi.
                  ⁃ GAP.Q1 có hỗ trợ dịch vụ chuyển khoản tiền tất toán (có phí) và ship hàng tồn tận nhà cho khách (khách thanh toán phí ship).
                `}</h2>
              </div>
              <div style={{ margin: 'auto' }}>
                <Button onClick={this.backPageProps} type="secondary">
                  Quay lại
                </Button>
              </div>
            </div>
          </div>
        </div>

        <MyModal ref={this.myModal} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  locale: state.locale,
  userData: state.userData,
});

export default withRouter(connect(mapStateToProps)(ConsignmentScreen));
