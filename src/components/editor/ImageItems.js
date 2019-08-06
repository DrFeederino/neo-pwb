import React, { Component } from 'react';
import { notification, Input, message } from 'antd';
import uuid from 'uuid/v4';
import i18n from 'i18next';

import { FlexBox } from '../flex';
import Icon from '../icon/Icon';
import Scrollbar from '../common/Scrollbar';
import CommonButton from '../common/CommonButton';

notification.config({
  top: 80,
  duration: 2
});

class ImageItems extends Component {
  constructor(props) {
    super(props);
    this.state = {
      canvasRef: props.canvasRef,
      descriptors: props.descriptors,
      collapse: true,
      textSearch: '',
      filteredDescriptors: []
    };
  }

  componentWillReceiveProps(nextProps) {
    if (
      JSON.stringify(this.state.descriptors) !==
      JSON.stringify(nextProps.descriptors)
    ) {
      const descriptors = Object.keys(nextProps.descriptors).reduce(
        (prev, key) => {
          return prev.concat(nextProps.descriptors[key]);
        },
        []
      );
      this.setState(
        {
          descriptors,
          canvasRef: nextProps.canvasRef
        },
        () => {
          this.attachEventListener(this.state.canvasRef);
        }
      );
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      JSON.stringify(this.state.descriptors) !==
      JSON.stringify(nextState.descriptors)
    ) {
      return true;
    } else if (
      JSON.stringify(this.state.filteredDescriptors) !==
      JSON.stringify(nextState.filteredDescriptors)
    ) {
      return true;
    } else if (this.state.textSearch !== nextState.textSearch) {
      return true;
    } else if (this.state.collapse !== nextState.collapse) {
      return true;
    }
    return false;
  }

  componentWillUnmount() {
    const { canvasRef } = this.state;
    this.detachEventListener(canvasRef);
  }

  attachEventListener = canvas => {
    canvas.canvas.wrapperEl.addEventListener(
      'dragenter',
      this.events.onDragEnter,
      false
    );
    canvas.canvas.wrapperEl.addEventListener(
      'dragover',
      this.events.onDragOver,
      false
    );
    canvas.canvas.wrapperEl.addEventListener(
      'dragleave',
      this.events.onDragLeave,
      false
    );
    canvas.canvas.wrapperEl.addEventListener('drop', this.events.onDrop, false);
  };

  detachEventListener = canvas => {
    canvas.canvas.wrapperEl.removeEventListener(
      'dragenter',
      this.events.onDragEnter
    );
    canvas.canvas.wrapperEl.removeEventListener(
      'dragover',
      this.events.onDragOver
    );
    canvas.canvas.wrapperEl.removeEventListener(
      'dragleave',
      this.events.onDragLeave
    );
    canvas.canvas.wrapperEl.removeEventListener('drop', this.events.onDrop);
  };

  /* eslint-disable react/sort-comp, react/prop-types */
  handlers = {
    onAddItem: (item, centered) => {
      const { canvasRef } = this.state;
      if (item.name === 'Fill') {
        canvasRef.drawingHandlers.fill.setColor('#33f');
        return;
      }
      if (canvasRef.workarea.layout === 'responsive') {
        if (!canvasRef.workarea._element) {
          notification.warn({
            message: i18n.t('validation.select-background')
          });
          return;
        }
      }
      if (canvasRef.interactionMode === 'polygon') {
        message.info(i18n.t('action.already-drawing'));
        return;
      }
      const id = uuid();
      const option = Object.assign({}, item.option, { id });
      canvasRef.handlers.add(option, centered);
    },
    onDrawingItem: item => {
      const { canvasRef } = this.state;
      if (canvasRef.workarea.layout === 'responsive') {
        if (!canvasRef.workarea._element) {
          notification.warn({
            message: i18n.t('validation.select-background')
          });
          return;
        }
      }
      if (canvasRef.interactionMode === 'polygon') {
        message.info(i18n.t('action.already-drawing'));
        return;
      }
      if (item.option.type === 'line') {
        canvasRef.drawingHandlers.line.init();
      } else if (item.option.type === 'arrow') {
        canvasRef.drawingHandlers.arrow.init();
      } else if (item.option.type === 'Pencil') {
        canvasRef.drawingHandlers.pencil.init();
      } else if (item.option.type === 'Pen') {
        canvasRef.drawingHandlers.pen.init();
      } else if (item.option.type === 'fill') {
        canvasRef.drawingHandlers.fill.init();
      } else {
        canvasRef.drawingHandlers.polygon.init();
      }
    },
    onCollapse: () => {
      this.setState({
        collapse: !this.state.collapse
      });
    },
    onSearchNode: e => {
      const filteredDescriptors = this.handlers
        .transformList()
        .filter(descriptor =>
          descriptor.name.toLowerCase().includes(e.target.value.toLowerCase())
        );
      this.setState({
        textSearch: e.target.value,
        filteredDescriptors
      });
    },
    transformList: () => {
      return Object.values(this.state.descriptors).reduce(
        (prev, curr) => prev.concat(curr),
        []
      );
    }
  };

  events = {
    onDragStart: (e, item) => {
      this.item = item;
      const { target } = e;
      target.classList.add('dragging');
    },
    onDragOver: e => {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'copy';
      return false;
    },
    onDragEnter: e => {
      const { target } = e;
      target.classList.add('over');
    },
    onDragLeave: e => {
      const { target } = e;
      target.classList.remove('over');
    },
    onDrop: e => {
      e = e || window.event;
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      if (!this.item && !e.dataTransfer) {
        notification.warn({
          message: i18n.t('action.unsupported')
        });
        return;
      }
      const { layerX, layerY } = e;
      const dt = e.dataTransfer;
      if (dt.types.length && dt.types[0] === 'Files') {
        const { files } = dt;
        Array.from(files).forEach(file => {
          file.uid = uuid();
          const { type } = file;
          if (
            type === 'image/png' ||
            type === 'image/jpeg' ||
            type === 'image/jpg'
          ) {
            const item = {
              option: {
                type: 'image',
                file,
                left: layerX,
                top: layerY
              }
            };
            this.handlers.onAddItem(item, false);
          } else {
            notification.warn({
              message: i18n.t('action.unsupported-file-type')
            });
          }
        });
        return false;
      }
      const option = Object.assign({}, this.item.option, {
        left: layerX,
        top: layerY
      });
      const newItem = Object.assign({}, this.item, { option });
      this.handlers.onAddItem(newItem, false);
      return false;
    },
    onDragEnd: e => {
      this.item = null;
      e.target.classList.remove('dragging');
    }
  };

  renderItems = items => {
    if (!items.map) return;
    return (
      <FlexBox
        flexWrap="wrap"
        flexDirection="column"
        style={{ width: '100%', overflow: 'hidden' }}
      >
        {items.map(item => this.renderItem(item))}
      </FlexBox>
    );
  };

  renderItem = (item, centered) =>
    item.type === 'drawing' ? ( // vector types are a bit mess to drag and drop
      <div
        key={item.name}
        draggable
        onClick={e => this.handlers.onDrawingItem(item)}
        className="rde-editor-side-item"
        style={{ justifyContent: this.state.collapse ? 'center' : null }}
      >
        <span className="rde-editor-side-item-icon">
          <Icon
            name={item.icon.name}
            prefix={item.icon.prefix}
            style={item.icon.style}
          />
        </span>
        {this.state.collapse ? null : (
          <div className="rde-editor-side-item-text">
            {i18n.t('editor.' + item.name.toLowerCase())}
          </div>
        )}
      </div>
    ) : (
      <div
        key={item.name}
        draggable
        onClick={e => this.handlers.onAddItem(item, centered)}
        onDragStart={e => this.events.onDragStart(e, item)}
        onDragEnd={e => this.events.onDragEnd(e, item)}
        className="rde-editor-side-item"
        style={{ justifyContent: this.state.collapse ? 'center' : null }}
      >
        <span className="rde-editor-side-item-icon">
          <Icon
            name={item.icon.name}
            prefix={item.icon.prefix}
            style={item.icon.style}
          />
        </span>
        {this.state.collapse ? null : (
          <div className="rde-editor-side-item-text">
            {i18n.t('editor.' + item.name.toLowerCase())}
          </div>
        )}
      </div>
    );

  render() {
    const { descriptors } = this.props;
    const { collapse, textSearch, filteredDescriptors } = this.state;
    return (
      <div className={'rde-editor-side' + (collapse ? ' minimize' : '')}>
        <FlexBox flex="1" flexDirection="column" style={{ height: '100%' }}>
          <FlexBox
            justifyContent="center"
            alignItems="center"
            style={{ height: 40 }}
          >
            <CommonButton
              icon={collapse ? 'angle-double-right' : 'angle-double-left'}
              shape="circle"
              className="rde-action-btn"
              style={{ margin: '0 4px' }}
              onClick={this.handlers.onCollapse}
            />
            {collapse ? null : (
              <Input
                style={{ margin: '8px' }}
                placeholder={i18n.t('action.search-list')}
                onChange={this.handlers.onSearchNode}
                value={textSearch}
                allowClear
              />
            )}
          </FlexBox>
          <Scrollbar>
            <FlexBox flex="1" style={{ overflowY: 'hidden' }}>
              {textSearch.length ? (
                this.renderItems(filteredDescriptors)
              ) : collapse ? (
                <FlexBox
                  flexWrap="wrap"
                  flexDirection="column"
                  style={{ width: '100%' }}
                  justifyContent="center"
                >
                  {this.handlers
                    .transformList()
                    .map(item => this.renderItem(item))}
                </FlexBox>
              ) : (
                <FlexBox style={{ width: '100%' }} flexDirection="column">
                  {Object.keys(descriptors).map(key => (
                    <FlexBox flexDirection="column" key={key}>
                      {this.renderItems(descriptors[key])}
                    </FlexBox>
                  ))}
                </FlexBox>
              )}
            </FlexBox>
          </Scrollbar>
        </FlexBox>
      </div>
    );
  }
}

export default ImageItems;
