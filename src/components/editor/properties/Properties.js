import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Collapse } from 'antd';
import i18n from 'i18next';
import PropertyDefinition from './PropertyDefinition';
import Scrollbar from '../../common/Scrollbar';

const { Panel } = Collapse;

class Properties extends Component {
  static propTypes = {
    canvasRef: PropTypes.any
  };

  render() {
    const { canvasRef, form } = this.props;
    const showArrow = false;
    if (canvasRef) {
      return (
        <Scrollbar>
          <Form layout="horizontal">
            <Collapse bordered={false}>
              {Object.keys(PropertyDefinition.map).map(key => {
                return (
                  <Panel
                    key={key}
                    header={i18n.t(
                      'editor.' + PropertyDefinition.map[key].title
                    )}
                    showArrow={showArrow}
                  >
                    {PropertyDefinition.map[key].component.render(
                      canvasRef,
                      form,
                      canvasRef.workarea
                    )}
                  </Panel>
                );
              })}
            </Collapse>
          </Form>
        </Scrollbar>
      );
    }
    return null;
  }
}

export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    const { onChange, selectedItem } = props;
    onChange(selectedItem, changedValues, { workarea: allValues });
  }
})(Properties);
