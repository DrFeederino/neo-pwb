import React from 'react';
import { Form, Input, Slider, Row, Col, InputNumber } from 'antd';
import i18n from 'i18next';
import ColorPicker from '../../common/ColorPicker';

/*  Layout stuff is commented out
    because the way the project was handling
    work with the canvas was dirty hack and
    not very representable IMO.
    For example, saving an image would result
    in a full capture of everything displayed
    canvas WITH workarea. It left much stuff
    outside of workarea if viewport size is bigger
    than workarea's. And maintaining this with up-to-date
    versions of fabric is impossible due to the change of
    how fabric handles images since 2.6.0. This is why
    I could only keep the version up to 2.5.0.
    I set out to change the workarea to be maximized
    with fixed layout set as default for now. I might
    be changing things for the better in the future.
    Also, the project could use more, even bigger cleanups.
    I'm looking towards removal of antd (~600Kb) and simplifying
    styling with components. This migh as well result in a full rewrite.
*/
export default {
  render(canvasRef, form, data) {
    const { getFieldDecorator } = form;
    if (!data) {
      return null;
    }
    //const layout = data.layout || 'fixed';
    return (
      <React.Fragment>
        {/*<Form.Item label={i18n.t('common.name')} colon={false}>
          {getFieldDecorator('name', {
            rules: [
              {
                required: false,
                message: i18n.t('validation.enter-arg', {
                  arg: i18n.t('common.name')
                })
              }
            ],
            initialValue: data.name || ''
          })(<Input />)}
        </Form.Item>

        <Form.Item label={i18n.t('common.layout')} colon={false}>
                    {
                        getFieldDecorator('layout', {
                            initialValue: layout,
                        })(
                            <Radio.Group size="small">
                                <Radio.Button value="fixed">{i18n.t('common.fixed')}</Radio.Button>
                                <Radio.Button value="responsive">{i18n.t('common.responsive')}</Radio.Button>
                                <Radio.Button value="fullscreen">{i18n.t('common.fullscreen')}</Radio.Button>
                            </Radio.Group>,
                        )
                    }
                </Form.Item> */}
        {
          //layout === 'fixed' ? (
          <React.Fragment>
            <Row>
              <Col span={12}>
                <Form.Item label={i18n.t('common.width')} colon={false}>
                  {getFieldDecorator('width', {
                    rules: [
                      {
                        type: 'number',
                        required: true,
                        message: i18n.t('validation.enter-arg', {
                          arg: i18n.t('common.width')
                        }),
                        min: 1
                      }
                    ],
                    initialValue: data.width * data.scaleX
                  })(<InputNumber />)}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={i18n.t('common.height')} colon={false}>
                  {getFieldDecorator('height', {
                    rules: [
                      {
                        type: 'number',
                        required: true,
                        message: i18n.t('validation.enter-arg', {
                          arg: i18n.t('common.height')
                        }),
                        min: 1
                      }
                    ],
                    initialValue: data.height * data.scaleY
                  })(<InputNumber />)}
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label={i18n.t('imagemap.style.fill-color')}
              colon={false}
            >
              {getFieldDecorator('backgroundColor', {
                initialValue: data.fill || 'rgba(255, 255, 255, 1)'
              })(<ColorPicker />)}
            </Form.Item>
          </React.Fragment>
          //) : null
        }
      </React.Fragment>
    );
  }
};
