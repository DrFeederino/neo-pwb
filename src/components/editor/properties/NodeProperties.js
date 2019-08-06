import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Collapse, Empty } from 'antd';
import i18n from 'i18next';
import PropertyDefinition from './PropertyDefinition';
import Scrollbar from '../../common/Scrollbar';
import { FlexBox } from '../../flex';

const { Panel } = Collapse;

class NodeProperties extends Component {
  static propTypes = {
    canvasRef: PropTypes.any,
    selectedItem: PropTypes.object
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.selectedItem && nextProps.selectedItem) {
      if (this.props.selectedItem.id !== nextProps.selectedItem.id) {
        nextProps.form.resetFields();
      }
    }
  }

  render() {
    const { canvasRef, selectedItem, form } = this.props;
    const showArrow = false;
    return (
      <Scrollbar>
        <Form layout="horizontal">
          <Collapse bordered={true}>
            {selectedItem && PropertyDefinition[selectedItem.type] ? (
              Object.keys(PropertyDefinition[selectedItem.type]).map(key => {
                return (
                  <Panel
                    key={key}
                    header={i18n.t(
                      'editor.' +
                        PropertyDefinition[selectedItem.type][key].title
                    )}
                    showArrow={showArrow}
                  >
                    {PropertyDefinition[selectedItem.type][
                      key
                    ].component.render(canvasRef, form, selectedItem)}
                  </Panel>
                );
              })
            ) : (
              <FlexBox justifyContent="center" alignItems="center">
                <Empty
                  description={i18n.t('editor.empty')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </FlexBox>
            )}
          </Collapse>
        </Form>
      </Scrollbar>
    );
  }
}

export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    const { onChange, selectedItem } = props;
    onChange(selectedItem, changedValues, allValues);
  }
})(NodeProperties);
