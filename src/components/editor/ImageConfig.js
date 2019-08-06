import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tabs } from 'antd';
import NodeProperties from './properties/NodeProperties';
import Properties from './properties/Properties';
import Icon from '../icon/Icon';
import CommonButton from '../common/CommonButton';
import CanvasList from '../canvas/CanvasList';

class ImageConfigurations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: 'image',
      collapse: true
    };
  }
  static propTypes = {
    canvasRef: PropTypes.any,
    selectedItem: PropTypes.object,
    onChange: PropTypes.func
  };

  onChangeTab = activeKey => {
    this.setState({
      activeKey,
      collapse: false
    });
  };

  onCollapse = () => {
    this.setState({
      collapse: !this.state.collapse
    });
  };

  render() {
    const { onChange, selectedItem, canvasRef } = this.props;
    const { collapse, activeKey } = this.state;
    return (
      <div
        className={'rde-editor-configurations' + (collapse ? ' minimize' : '')}
      >
        <CommonButton
          className="rde-action-btn"
          shape="circle"
          icon={collapse ? 'angle-double-left' : 'angle-double-right'}
          onClick={this.onCollapse}
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 1 }}
        />
        <Tabs
          tabPosition="right"
          style={{ height: '100%' }}
          activeKey={activeKey}
          onChange={this.onChangeTab}
          tabBarStyle={{ marginTop: 60 }}
        >
          <Tabs.TabPane
            tab={<Icon name="cog" />}
            key="image"
            forceRender={false}
          >
            <Properties onChange={onChange} canvasRef={canvasRef} />
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={<Icon name="cogs" />}
            key="props"
            forceRender={false}
          >
            <NodeProperties
              onChange={onChange}
              selectedItem={selectedItem}
              canvasRef={canvasRef}
            />
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={<Icon name="layer-group" />}
            key="list"
            forceRender={false}
          >
            <div className="rde-canvas-list">
              <CanvasList canvasRef={canvasRef} selectedItem={selectedItem} />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }
}

export default ImageConfigurations;
