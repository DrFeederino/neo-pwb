import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import Icon from '../icon/Icon';
import { FlexBox, FlexItem } from '../flex';
import i18n from 'i18next';

class CanvasList extends Component {
  static propTypes = {
    canvasRef: PropTypes.any,
    selectedItem: PropTypes.object
  };

  renderActions = () => {
    const { canvasRef } = this.props;
    const idCropping = canvasRef ? canvasRef.interactionMode === 'crop' : false;
    return (
      <FlexItem className="rde-canvas-list-actions" flex="0 1 auto">
        <FlexBox justifyContent="space-between" alignItems="center">
          <FlexBox flex="1" justifyContent="center">
            <Button
              className="rde-action-btn rde-action-canvas-list"
              disabled={idCropping}
              onClick={e => canvasRef.handlers.sendBackwards()}
            >
              <Icon name="arrow-up" />
            </Button>
          </FlexBox>
          <FlexBox flex="1" justifyContent="center">
            <Button
              className="rde-action-btn rde-action-canvas-list"
              disabled={idCropping}
              onClick={e => canvasRef.handlers.bringForward()}
            >
              <Icon name="arrow-down" />
            </Button>
          </FlexBox>
        </FlexBox>
      </FlexItem>
    );
  };

  renderItem = () => {
    const { canvasRef, selectedItem } = this.props;
    const idCropping = canvasRef ? canvasRef.interactionMode === 'crop' : false;
    return canvasRef
      ? canvasRef.canvas
          .getObjects()
          .filter(obj => {
            if (obj.id === 'workarea') {
              return false;
            }
            if (obj.id) {
              return true;
            }
            return false;
          })
          .map(obj => {
            let icon;
            let title = '';
            let prefix = 'fas';
            if (obj.type === 'i-text') {
              icon = 'map-marker-alt';
              title = i18n.t('editor.icon');
            } else if (obj.type === 'textbox') {
              icon = 'font';
              title = i18n.t('editor.text');
            } else if (obj.type === 'image') {
              icon = 'image';
              title = i18n.t('editor.image');
            } else if (obj.type === 'triangle') {
              icon = 'image';
              title = i18n.t('editor.image');
            } else if (obj.type === 'rect') {
              icon = 'image';
              title = i18n.t('editor.rectangle');
            } else if (obj.type === 'circle') {
              icon = 'circle';
              title = i18n.t('editor.circle');
            } else if (obj.type === 'polygon') {
              icon = 'draw-polygon';
              title = i18n.t('editor.polygon');
            } else if (obj.type === 'line') {
              icon = 'image';
              title = i18n.t('editor.line');
            } else if (obj.type === 'path') {
              icon = 'paint-brush';
              title = i18n.t('editor.brush');
            } else {
              icon = 'image';
              title = i18n.t('editor.default');
            }
            let className = 'rde-canvas-list-item';
            if (selectedItem && selectedItem.id === obj.id) {
              className += ' selected-item';
            }
            return (
              <FlexItem
                key={obj.id}
                className={className}
                flex="1"
                onClick={() => canvasRef.handlers.select(obj)}
              >
                <FlexBox alignItems="center">
                  <Icon
                    className="rde-canvas-list-item-icon"
                    name={icon}
                    size={1.5}
                    style={{ width: 32 }}
                    prefix={prefix}
                  />
                  <div className="rde-canvas-list-item-text">{title}</div>
                  <FlexBox
                    className="rde-canvas-list-item-actions"
                    flex="1"
                    justifyContent="flex-end"
                  >
                    <Button
                      className="rde-action-btn"
                      shape="circle"
                      disabled={idCropping}
                      onClick={e => {
                        e.stopPropagation();
                        canvasRef.handlers.duplicateById(obj.id);
                      }}
                    >
                      <Icon name="clone" />
                    </Button>
                    <Button
                      className="rde-action-btn"
                      shape="circle"
                      disabled={idCropping}
                      onClick={e => {
                        e.stopPropagation();
                        canvasRef.handlers.removeById(obj.id);
                      }}
                    >
                      <Icon name="trash" />
                    </Button>
                  </FlexBox>
                </FlexBox>
              </FlexItem>
            );
          })
      : null;
  };

  render() {
    return (
      <FlexBox style={{ height: '100%', width: '100%' }} flexDirection="column">
        {this.renderActions()}
        <div className="rde-canvas-list-items">{this.renderItem()}</div>
      </FlexBox>
    );
  }
}

export default CanvasList;
