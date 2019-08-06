import React, { Component } from 'react';
import PropTypes from 'prop-types';
import i18n from 'i18next';
import { FlexBox, FlexItem } from '../flex';
import { CommonButton } from '../common';
//import Icon from '../icon/Icon';
import { Button, Switch, Icon } from 'antd';

class ImageHeaderToolbar extends Component {
  static propTypes = {
    canvasRef: PropTypes.any
  };

  render() {
    const { canvasRef, share } = this.props;
    const isCropping = canvasRef ? canvasRef.interactionMode === 'crop' : false;
    return (
      <FlexBox className="rde-editor-header-toolbar-container" flex="1">
        <FlexItem
          className="rde-canvas-toolbar rde-canvas-toolbar-alignment"
          style={{ paddingLeft: '4em' }}
        >
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            onClick={() => canvasRef.handlers.new()}
            icon="file"
            tooltipTitle={i18n.t('action.image-new')}
          />
          {/* WIP
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            onClick={() => share()}
            icon="share-alt"
            tooltipTitle={i18n.t('action.image-share')}
          />
          */}
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            onClick={() => canvasRef.handlers.saveCanvasImage()}
            icon="save"
            tooltipTitle={i18n.t('action.image-save')}
          />
        </FlexItem>
        <FlexItem className="rde-canvas-toolbar rde-canvas-toolbar-alignment">
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.bringForward()}
            icon="angle-up"
            tooltipTitle={i18n.t('action.bring-forward')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.sendBackwards()}
            icon="angle-down"
            tooltipTitle={i18n.t('action.send-backwards')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.bringToFront()}
            icon="angle-double-up"
            tooltipTitle={i18n.t('action.bring-to-front')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.sendToBack()}
            icon="angle-double-down"
            tooltipTitle={i18n.t('action.send-to-back')}
          />
        </FlexItem>
        <FlexItem className="rde-canvas-toolbar rde-canvas-toolbar-alignment">
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.alignmentHandlers.left()}
            icon="align-left"
            tooltipTitle={i18n.t('action.align-left')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.alignmentHandlers.center()}
            icon="align-center"
            tooltipTitle={i18n.t('action.align-center')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.alignmentHandlers.right()}
            icon="align-right"
            tooltipTitle={i18n.t('action.align-right')}
          />
        </FlexItem>
        <FlexItem className="rde-canvas-toolbar rde-canvas-toolbar-group">
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.toGroup()}
            icon="object-group"
            tooltipTitle={i18n.t('action.object-group')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.toActiveSelection()}
            icon="object-ungroup"
            tooltipTitle={i18n.t('action.object-ungroup')}
          />
        </FlexItem>
        <FlexItem className="rde-canvas-toolbar rde-canvas-toolbar-crop">
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={canvasRef ? canvasRef.cropHandlers.validType() : true}
            onClick={() => canvasRef.cropHandlers.start()}
            icon="crop"
            tooltipTitle={i18n.t('action.crop')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={canvasRef ? !canvasRef.cropRect : true}
            onClick={() => canvasRef.cropHandlers.finish()}
            icon="check"
            tooltipTitle={i18n.t('action.crop-save')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={canvasRef ? !canvasRef.cropRect : true}
            onClick={() => canvasRef.cropHandlers.cancel()}
            icon="times"
            tooltipTitle={i18n.t('action.crop-cancel')}
          />
        </FlexItem>
        <FlexItem className="rde-canvas-toolbar rde-canvas-toolbar-operation">
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.duplicate()}
            icon="clone"
            tooltipTitle={i18n.t('action.clone')}
          />
          <CommonButton
            className="rde-action-btn"
            shape="circle"
            disabled={isCropping}
            onClick={() => canvasRef.handlers.remove()}
            icon="trash"
            tooltipTitle={i18n.t('action.delete')}
          />
        </FlexItem>
        <FlexItem className="rde-canvas-toolbar rde-canvas-toolbar-history">
          <Button
            className="rde-action-btn"
            disabled={isCropping || (canvasRef && !canvasRef.undos.length)}
            onClick={() => canvasRef.transactionHandlers.undo()}
          >
            <Icon type="undo" style={{ marginRight: 8 }} />
            {i18n.t('action.undo')}
          </Button>
          <Button
            className="rde-action-btn"
            disabled={isCropping || (canvasRef && !canvasRef.redos.length)}
            onClick={() => canvasRef.transactionHandlers.redo()}
          >
            {i18n.t('action.redo')}
            <Icon type="redo" style={{ marginLeft: 8 }} />
          </Button>
        </FlexItem>
        <FlexItem
          className="rde-canvas-toolbar rde-canvas-dark-theme"
          style={{ paddingRight: '4em' }}
        >
          <span style={{ padding: '0 1em 0 1em' }}>
            {i18n.t('editor.darkTheme')}
          </span>
          <Switch
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
            onChange={this.props.onChange}
          />
        </FlexItem>
      </FlexBox>
    );
  }
}

export default ImageHeaderToolbar;
