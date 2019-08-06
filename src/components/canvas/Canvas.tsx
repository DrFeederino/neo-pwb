import React from 'react';
import ReactDOM from 'react-dom';
import { fabric } from 'fabric';
import uuid from 'uuid/v4';
import i18n from 'i18next';
import CanvasObjects from './CanvasObjects';
import Arrow from './Arrow';

//import '../../styles/core/tooltip.css';
//import '../../styles/core/contextmenu.css';

const defaultCanvasOption = {
  preserveObjectStacking: true,
  width: 500,
  height: 500,
  selection: true,
  defaultCursor: 'default',
  backgroundColor: '#fff',
  isDrawingMode: false
};

const defaultWorkareaOption = {
  width: defaultCanvasOption.width,
  height: defaultCanvasOption.height,
  workareaWidth: defaultCanvasOption.width,
  workareaHeight: defaultCanvasOption.height,
  lockScalingX: false,
  lockScalingY: false,
  scaleX: 1,
  scaleY: 1,
  backgroundColor: defaultCanvasOption.backgroundColor,
  hasBorders: true,
  hasControls: false,
  selectable: false,
  lockMovementX: true,
  lockMovementY: true,
  hoverCursor: 'default',
  name: '',
  id: 'workarea',
  type: 'image',
  layout: 'fullscreen', // fixed, responsive, fullscreen
  link: {},
  tooltip: {
    enabled: false
  }
};

const defaultKeyboardEvent = {
  move: true,
  all: true,
  copy: true,
  paste: true,
  esc: true,
  del: true,
  transaction: true
};
interface CanvasProps {
  color: any;
  width: number;
  height: number;
  fabricObjects: object;
  editable: boolean;
  canvasOption: object;
  defaultOptions: object;
  activeSelection: object;
  tooltip: any;
  zoomEnabled: Boolean;
  minZoom: Number;
  maxZoom: Number;
  propertiesToInclude: Array<string>;
  guidelineOption: Object;
  workareaOption: Object;
  gridOption: object;
  onModified: object;
  onAdd: () => {};
  onRemove: () => {};
  onSelect: () => {};
  onZoom: () => {};
  onTooltip: () => {};
  onLink: () => {};
  keyEvent: object;
}

interface CanvasState {
  id: any;
  clipboard: any;
  width: number;
  height: number;
  color: any;
  undos: [];
  redos: [];
}

class Canvas extends React.Component<CanvasProps, CanvasState> {
  canvas: any = null;
  container: any = null;
  fabricObjects: any = null;
  objects: any[] = [];
  keyEvent: object = {};
  workarea: any = null;
  interactionMode: string = '';

  static defaultProps = {
    editable: true,
    canvasOption: {
      selection: true
    },
    defaultOptions: {},
    activeSelection: {
      hasControls: true
    },
    tooltip: null,
    zoomEnabled: true,
    minZoom: 0,
    maxZoom: 300,
    propertiesToInclude: [],
    workareaOption: {},
    gridOption: {
      enabled: false,
      grid: 50,
      snapToGrid: false
    },
    guidelineOption: {
      enabled: true
    },
    keyEvent: {}
  };

  constructor(props: CanvasProps) {
    super(props);
    this.state = {
      id: uuid(),
      clipboard: null,
      width: props.width,
      height: props.height,
      color: props.color,
      undos: [],
      redos: []
    };
    this.fabricObjects = CanvasObjects(
      props.fabricObjects,
      props.defaultOptions
    );
    this.container = React.createRef();
    this.objects = [];
    this.keyEvent = Object.assign({}, defaultKeyboardEvent, props.keyEvent);
  }

  componentDidMount() {
    const { id } = this.state;
    const {
      editable,
      canvasOption,
      workareaOption,
      guidelineOption
    } = this.props;
    const mergedCanvasOption = Object.assign(
      {},
      defaultCanvasOption,
      canvasOption
    );
    this.canvas = new fabric.Canvas(`canvas_${id}`, mergedCanvasOption);
    this.canvas.setBackgroundColor(
      mergedCanvasOption.backgroundColor,
      this.canvas.requestRenderAll.bind(this.canvas)
    );
    const mergedWorkareaOption = Object.assign(
      {},
      defaultWorkareaOption,
      workareaOption,
      { backgroundColor: 'rgba(0, 0, 0, 0)' } //dirty hack
    );
    this.workarea = new fabric.Image(undefined, mergedWorkareaOption);
    this.canvas.add(this.workarea);
    this.objects.push(this.workarea);
    this.canvas.centerObject(this.workarea);
    //this.canvas.setWidth(this.props.canvasOption.width);
    //this.canvas.setHeight(this.props.canvasOption.height);
    this.canvas.requestRenderAll();
    this.gridHandlers.init();
    const {
      modified,
      moving,
      moved,
      scaling,
      mousewheel,
      mousedown,
      mousemove,
      mouseup,
      mouseout,
      selection,
      beforeRender,
      afterRender
    } = this.eventHandlers;
    if (editable) {
      this.transactionHandlers.init();
      this.interactionMode = 'selection';
      this.panning = false;
      if (guidelineOption.enabled) {
        this.guidelineHandlers.init();
      }
      this.contextmenuRef = document.createElement('div');
      this.contextmenuRef.id = `${id}_contextmenu`;
      this.contextmenuRef.className = 'rde-contextmenu contextmenu-hidden';
      document.body.appendChild(this.contextmenuRef);
      this.canvas.on({
        'object:modified': modified,
        'object:scaling': scaling,
        'object:moving': moving,
        'object:moved': moved,
        'mouse:wheel': mousewheel,
        'mouse:down': mousedown,
        'mouse:move': mousemove,
        'mouse:up': mouseup,
        'selection:cleared': selection,
        'selection:created': selection,
        'selection:updated': selection,
        'before:render': guidelineOption.enabled ? beforeRender : null,
        'after:render': guidelineOption.enabled ? afterRender : null,
        'path:created': opt => this.drawingHandlers.pencil.generate(opt)
      });
      this.attachEventListener();
    } else {
      this.tooltipRef = document.createElement('div');
      this.tooltipRef.id = `${id}_tooltip`;
      this.tooltipRef.className = 'rde-tooltip tooltip-hidden';
      document.body.appendChild(this.tooltipRef);
      this.canvas.on({
        'mouse:down': mousedown,
        'mouse:move': mousemove,
        'mouse:out': mouseout,
        'mouse:up': mouseup,
        'mouse:wheel': mousewheel
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(this.props.canvasOption) !==
      JSON.stringify(prevProps.canvasOption)
    ) {
      const {
        canvasOption: { width: currentWidth, height: currentHeight }
      } = this.props;
      const {
        canvasOption: { width: prevWidth, height: prevHeight }
      } = prevProps;
      if (currentWidth !== prevWidth || currentHeight !== prevHeight) {
        this.eventHandlers.resize(
          prevWidth,
          prevHeight,
          currentWidth,
          currentHeight
        );
      }
      this.canvas.setBackgroundColor(
        this.props.canvasOption.backgroundColor,
        this.canvas.requestRenderAll.bind(this.canvas)
      );
      this.canvas.selection = this.props.canvasOption.selection;
    }
    if (
      JSON.stringify(this.props.keyEvent) !== JSON.stringify(prevProps.keyEvent)
    ) {
      this.keyEvent = Object.assign(
        {},
        defaultKeyboardEvent,
        this.props.keyEvent
      );
    }
    if (
      JSON.stringify(this.props.fabricObjects) !==
      JSON.stringify(prevProps.fabricObjects)
    ) {
      this.fabricObjects = CanvasObjects(this.props.fabricObjects);
    } else if (
      JSON.stringify(this.props.workareaOption) !==
      JSON.stringify(prevProps.workareaOption)
    ) {
      this.workarea.set({
        ...this.props.workareaOption
      });
    } else if (
      JSON.stringify(this.props.guidelineOption) !==
      JSON.stringify(prevProps.guidelineOption)
    ) {
      if (this.props.guidelineOption.enabled) {
        this.canvas.on({
          'before:render': this.eventHandlers.beforeRender,
          'after:render': this.eventHandlers.afterRender
        });
      } else {
        this.canvas.off({
          'before:render': this.eventHandlers.beforeRender,
          'after:render': this.eventHandlers.afterRender
        });
      }
    }
  }

  componentWillUnmount() {
    this.detachEventListener();
    const { editable } = this.props;
    const {
      modified,
      moving,
      moved,
      scaling,
      mousewheel,
      mousedown,
      mousemove,
      mouseup,
      mouseout,
      selection,
      beforeRender,
      afterRender
    } = this.eventHandlers;
    if (editable) {
      this.canvas.off({
        'object:modified': modified,
        'object:scaling': scaling,
        'object:moving': moving,
        'object:moved': moved,
        'mouse:wheel': mousewheel,
        'mouse:down': mousedown,
        'mouse:move': mousemove,
        'mouse:up': mouseup,
        'selection:cleared': selection,
        'selection:created': selection,
        'selection:updated': selection,
        'before:render': beforeRender,
        'after:render': afterRender
      });
    } else {
      this.canvas.off({
        'mouse:down': mousedown,
        'mouse:move': mousemove,
        'mouse:out': mouseout,
        'mouse:up': mouseup,
        'mouse:wheel': mousewheel
      });
      this.canvas.getObjects().forEach(object => {
        object.off('mousedown', this.eventHandlers.object.mousedown);
      });
    }
    this.handlers.clear(true);
    if (this.tooltipRef) {
      document.body.removeChild(this.tooltipRef);
    }
  }

  attachEventListener = () => {
    // if add canvas wrapper element event, tabIndex = 1000;
    this.canvas.wrapperEl.tabIndex = 1000;
    document.addEventListener('keydown', this.eventHandlers.keydown, false);
    document.addEventListener('paste', this.eventHandlers.paste, false);
    document.addEventListener(
      'mousedown',
      this.eventHandlers.onmousedown,
      false
    );
    this.canvas.wrapperEl.addEventListener(
      'contextmenu',
      this.eventHandlers.contextmenu,
      false
    );
  };

  detachEventListener = () => {
    document.removeEventListener('keydown', this.eventHandlers.keydown);
    document.removeEventListener('paste', this.eventHandlers.paste);
    document.removeEventListener('mousedown', this.eventHandlers.onmousedown);
    this.canvas.wrapperEl.removeEventListener(
      'contextmenu',
      this.eventHandlers.contextmenu
    );
  };

  /* eslint-disable react/sort-comp, react/prop-types */
  handlers = {
    new: () => {
      const { canvas, workarea } = this;
      workarea.backgroundColor = defaultCanvasOption.backgroundColor;
      canvas.setHeight(defaultCanvasOption.height);
      canvas.setWidth(defaultCanvasOption.width);
      canvas.setBackgroundColor(defaultCanvasOption.backgroundColor);
      canvas.clear();
      canvas.add(workarea);
      canvas.requestRenderAll();
    },
    centerObject: (obj, centered) => {
      if (centered) {
        this.canvas.centerObject(obj);
        obj.setCoords();
      } else {
        this.handlers.setByObject(
          obj,
          'left',
          obj.left / this.canvas.getZoom() -
            obj.width / 2 -
            this.canvas.viewportTransform[4] / this.canvas.getZoom()
        );
        this.handlers.setByObject(
          obj,
          'top',
          obj.top / this.canvas.getZoom() -
            obj.height / 2 -
            this.canvas.viewportTransform[5] / this.canvas.getZoom()
        );
      }
    },
    add: (obj, centered = true, loaded = false, transaction = true) => {
      if (obj.type === 'fill') {
        this.drawingHandlers.fill.init();
        this.canvas.setBackgroundColor('#999');
        this.canvas.requestRenderAll();
        this.drawingHandlers.fill.setColor('#666');
        return;
      }
      this.contextmenuHandlers.hide();
      const { editable } = this.props;
      const option = {
        hasControls: editable,
        hasBorders: editable,
        selection: editable,
        lockMovementX: !editable,
        lockMovementY: !editable,
        hoverCursor: !editable ? 'pointer' : 'move'
      };
      if (obj.type === 'i-text') {
        option.editable = false;
      } else {
        option.editable = editable;
      }
      if (editable && this.workarea.layout === 'fullscreen') {
        option.scaleX = this.workarea.scaleX;
        option.scaleY = this.workarea.scaleY;
      }
      const newOption = Object.assign({}, option, obj);
      let createdObj;
      if (obj.type === 'group') {
        const objects = this.handlers.addGroup(newOption, centered, loaded);
        const groupOption = Object.assign({}, newOption, { objects });
        if (obj.type === 'image') {
          this.handlers.addImage(newOption, centered, loaded, transaction);
          return;
        }
        createdObj = this.fabricObjects[obj.type].create({
          name: 'New Group',
          ...groupOption
        });
        this.canvas.add(createdObj);
        this.objects.push(createdObj);
        if (obj.type !== 'polygon' && editable && !loaded) {
          this.handlers.centerObject(createdObj, centered);
        }
        if (
          !editable &&
          createdObj.animation &&
          createdObj.animation.autoplay
        ) {
          this.animationHandlers.play(createdObj.id);
        }
        const { onAdd } = this.props;
        if (onAdd && editable && !loaded) {
          onAdd(createdObj);
        }
        return createdObj;
      }
      if (obj.type === 'image') {
        this.handlers.addImage(newOption, centered, loaded);
        return;
      }
      createdObj = this.fabricObjects[obj.type].create(newOption);
      this.canvas.add(createdObj);
      this.objects.push(createdObj);
      if (
        obj.superType !== 'drawing' &&
        obj.superType !== 'link' &&
        editable &&
        !loaded
      ) {
        this.handlers.centerObject(createdObj, centered);
      }
      if (!loaded && transaction) {
        this.transactionHandlers.save(createdObj, 'add');
      }
      const { onAdd } = this.props;
      if (onAdd && editable && !loaded) {
        onAdd(createdObj);
      }
      if (!loaded) {
        if (createdObj.superType === 'node') {
          createdObj.setShadow({
            color: createdObj.stroke
          });
          this.nodeHandlers.highlightingNode(createdObj);
        }
      }
      return createdObj;
    },
    addGroup: (obj, centered = true, loaded = false) => {
      return obj.objects.map(child => {
        return this.handlers.add(child, centered, loaded);
      });
    },
    addImage: (obj, centered = true, loaded = false, transaction = true) => {
      const { editable } = this.props;
      const image = new Image();
      const { src, file, ...otherOption } = obj;
      const createImage = img => {
        const createdObj = new fabric.Image(img, {
          src,
          file,
          ...this.props.defaultOptions,
          ...otherOption
        });
        if (!editable) {
          createdObj.on('mousedown', this.eventHandlers.object.mousedown);
        }
        this.canvas.add(createdObj);
        this.objects.push(createdObj);
        if (editable && !loaded) {
          this.handlers.centerObject(createdObj, centered);
        }
        const { onAdd } = this.props;
        if (!loaded && transaction) {
          this.transactionHandlers.save(createdObj, 'add');
        }
        if (onAdd && editable && !loaded) {
          onAdd(createdObj);
        }
      };
      if (src) {
        image.onload = () => {
          createImage(image);
        };
        image.src = src;
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        image.onload = () => {
          createImage(image);
        };
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    addElement: (obj, centered = true, loaded = false, transaction = true) => {
      const { canvas } = this;
      const { editable } = this.props;
      const { src, file, code, ...otherOption } = obj;
      const createdObj = new fabric.Rect({
        src,
        file,
        code,
        ...this.props.defaultOptions,
        ...otherOption,
        fill: 'rgba(255, 255, 255, 0)',
        stroke: 'rgba(255, 255, 255, 0)'
      });
      if (!editable) {
        createdObj.on('mousedown', this.eventHandlers.object.mousedown);
      }
      canvas.add(createdObj);
      this.objects.push(createdObj);
      if (src || file || code) {
        this.elementHandlers.set(createdObj, src || code);
      }
      if (editable && !loaded) {
        this.handlers.centerObject(createdObj, centered);
      }
      if (!loaded && transaction) {
        this.transactionHandlers.save(createdObj, 'add');
      }
      const { onAdd } = this.props;
      if (onAdd && editable && !loaded) {
        onAdd(createdObj);
      }
    },
    remove: () => {
      const activeObject = this.canvas.getActiveObject();
      if (!activeObject) {
        return false;
      }
      if (activeObject.type !== 'activeSelection') {
        this.transactionHandlers.save(activeObject, 'remove');
        this.canvas.discardActiveObject();
        if (activeObject.superType === 'link') {
          this.linkHandlers.remove(activeObject);
        } else if (activeObject.superType === 'node') {
          if (activeObject.toPort) {
            if (activeObject.toPort.links.length) {
              activeObject.toPort.links.forEach(link => {
                this.linkHandlers.remove(link, 'from');
              });
            }
            this.canvas.remove(activeObject.toPort);
          }
          if (activeObject.fromPort && activeObject.fromPort.length) {
            activeObject.fromPort.forEach(port => {
              if (port.links.length) {
                port.links.forEach(link => {
                  this.linkHandlers.remove(link, 'to');
                });
              }
              this.canvas.remove(port);
            });
          }
        }
        this.canvas.remove(activeObject);
        this.handlers.removeOriginById(activeObject.id);
      } else {
        const { _objects: activeObjects } = activeObject;
        this.canvas.discardActiveObject();
        activeObjects.forEach(obj => {
          if (obj.superType === 'node') {
            this.canvas.remove(obj.toPort);
            obj.fromPort.forEach(port => {
              this.canvas.remove(port);
            });
          }
          this.canvas.remove(obj);
          this.handlers.removeOriginById(obj.id);
        });
      }
      const { onRemove } = this.props;
      if (onRemove) {
        onRemove(activeObject);
      }
    },
    removeById: id => {
      this.contextmenuHandlers.hide();
      const findObject = this.handlers.findById(id);
      if (findObject) {
        this.canvas.discardActiveObject();
        const { onRemove } = this.props;
        if (onRemove) {
          onRemove(findObject);
        }
        this.canvas.remove(findObject);
        this.handlers.removeOriginById(findObject.id);
      }
    },
    duplicate: () => {
      const { onAdd, propertiesToInclude } = this.props;
      const activeObject = this.canvas.getActiveObject();
      if (!activeObject) {
        return false;
      }
      activeObject.clone(clonedObj => {
        this.canvas.discardActiveObject();
        clonedObj.set({
          left: clonedObj.left + 10,
          top: clonedObj.top + 10,
          evented: true
        });
        if (clonedObj.type === 'activeSelection') {
          clonedObj.canvas = this.canvas;
          clonedObj.forEachObject(obj => {
            obj.set('name', `${obj.name}_clone`);
            obj.set('id', uuid());
            this.canvas.add(obj);
            this.objects.push(obj);
          });
          if (onAdd) {
            onAdd(clonedObj);
          }
          clonedObj.setCoords();
        } else {
          clonedObj.set('name', `${clonedObj.name}_clone`);
          clonedObj.set('id', uuid());
          this.canvas.add(clonedObj);
          this.objects.push(clonedObj);
          if (onAdd) {
            onAdd(clonedObj);
          }
        }
        this.canvas.setActiveObject(clonedObj);
        this.portHandlers.createPort(clonedObj);
        this.canvas.requestRenderAll();
      }, propertiesToInclude);
    },
    duplicateById: id => {
      this.contextmenuHandlers.hide();
      const { onAdd, propertiesToInclude } = this.props;
      const findObject = this.handlers.findById(id);
      if (findObject) {
        findObject.clone(cloned => {
          cloned.set({
            left: cloned.left + 10,
            top: cloned.top + 10,
            id: uuid(),
            name: `${cloned.name}_clone`,
            evented: true
          });
          this.canvas.add(cloned);
          this.objects.push(cloned);
          if (onAdd) {
            onAdd(cloned);
          }
          this.canvas.setActiveObject(cloned);
          this.canvas.requestRenderAll();
        }, propertiesToInclude);
      }
    },
    copy: () => {
      const { propertiesToInclude } = this.props;
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && activeObject.superType === 'link') {
        return false;
      }
      if (activeObject) {
        activeObject.clone(cloned => {
          this.setState({
            clipboard: cloned
          });
        }, propertiesToInclude);
      }
    },
    paste: () => {
      const { onAdd, propertiesToInclude } = this.props;
      const { clipboard } = this.state;
      if (!clipboard) {
        return false;
      }
      clipboard.clone(clonedObj => {
        this.canvas.discardActiveObject();
        clonedObj.set({
          left: clonedObj.left + 10,
          top: clonedObj.top + 10,
          id: uuid(),
          evented: true
        });
        if (clonedObj.type === 'activeSelection') {
          clonedObj.canvas = this.canvas;
          clonedObj.forEachObject(obj => {
            obj.set('id', uuid());
            obj.set('name', `${obj.name}_clone`);
            this.canvas.add(obj);
            this.objects.push(obj);
          });
          this.transactionHandlers.save(clonedObj, 'add');
          if (onAdd) {
            onAdd(clonedObj);
          }
          clonedObj.setCoords();
        } else {
          clonedObj.set('id', uuid());
          clonedObj.set('name', `${clonedObj.name}_clone`);
          this.canvas.add(clonedObj);
          this.objects.push(clonedObj);
          this.transactionHandlers.save(clonedObj, 'add');
          if (onAdd) {
            onAdd(clonedObj);
          }
        }
        const newClipboard = clipboard.set({
          top: clonedObj.top,
          left: clonedObj.left
        });
        this.setState({
          clipboard: newClipboard
        });
        this.canvas.setActiveObject(clonedObj);
        this.portHandlers.createPort(clonedObj);
        this.canvas.requestRenderAll();
      }, propertiesToInclude);
    },
    set: (key, value) => {
      const activeObject = this.canvas.getActiveObject();
      if (!activeObject) {
        return false;
      }
      activeObject.set(key, value);
      activeObject.setCoords();
      this.canvas.requestRenderAll();
      const { onModified } = this.props;
      if (onModified) {
        onModified(activeObject);
      }
    },
    setObject: option => {
      const activeObject = this.canvas.getActiveObject();
      if (!activeObject) {
        return false;
      }
      Object.keys(option).forEach(key => {
        if (option[key] !== activeObject[key]) {
          activeObject.set(key, option[key]);
          activeObject.setCoords();
        }
      });
      this.canvas.requestRenderAll();
      const { onModified } = this.props;
      if (onModified) {
        onModified(activeObject);
      }
    },
    setByObject: (obj, key, value, transaction = true) => {
      if (!obj) {
        return;
      }
      obj.set(key, value);
      obj.setCoords();
      this.canvas.requestRenderAll();
      const { onModified } = this.props;
      if (onModified && transaction) {
        onModified(obj);
      }
    },
    setById: (id, key, value, transaction = true) => {
      const findObject = this.handlers.findById(id);
      this.handlers.setByObject(findObject, key, value, transaction);
    },
    setShadow: (key, value) => {
      const activeObject = this.canvas.getActiveObject();
      if (!activeObject) {
        return false;
      }
      activeObject.setShadow(value);
      this.canvas.requestRenderAll();
      const { onModified } = this.props;
      if (onModified) {
        onModified(activeObject);
      }
    },
    loadImage: (obj, src, transaction = true) => {
      fabric.util.loadImage(src, source => {
        if (obj.type !== 'image') {
          obj.setPatternFill({
            source,
            repeat: 'repeat'
          });
          obj.setCoords();
          this.canvas.requestRenderAll();
          return;
        }
        obj.setElement(source);
        obj.setCoords();
        this.canvas.requestRenderAll();
        const { onModified } = this.props;
        if (onModified && transaction) {
          onModified(obj);
        }
      });
    },
    setImage: (obj, src, transaction = true) => {
      if (!src) {
        this.handlers.loadImage(obj, null, transaction);
        obj.set('file', null);
        obj.set('src', null);
        return;
      }
      if (typeof src === 'string') {
        this.handlers.loadImage(obj, src, transaction);
        obj.set('file', null);
        obj.set('src', src);
      } else {
        const reader = new FileReader();
        reader.onload = e => {
          this.handlers.loadImage(obj, e.target.result, transaction);
          const file = {
            name: src.name,
            size: src.size,
            uid: src.uid,
            type: src.type
          };
          obj.set('file', file);
          obj.set('src', null);
        };
        reader.readAsDataURL(src);
      }
    },
    setImageById: (id, source, transaction = true) => {
      const findObject = this.handlers.findById(id);
      this.handlers.setImage(findObject, source, transaction);
    },
    find: obj => this.handlers.findById(obj.id),
    findById: id => {
      let findObject;
      const exist = this.canvas.getObjects().some(obj => {
        if (obj.id === id) {
          findObject = obj;
          return true;
        }
        return false;
      });
      if (!exist) {
        return exist;
      }
      return findObject;
    },
    allSelect: () => {
      const { canvas } = this;
      canvas.discardActiveObject();
      const filteredObjects = canvas.getObjects().filter(obj => {
        if (obj.id === 'workarea') {
          return false;
        }
        if (!obj.evented) {
          return false;
        }
        if (obj.lock) {
          return false;
        }
        return true;
      });
      if (!filteredObjects.length) {
        return;
      }
      if (filteredObjects.length === 1) {
        canvas.setActiveObject(filteredObjects[0]);
        canvas.requestRenderAll();
        return;
      }
      const activeSelection = new fabric.ActiveSelection(filteredObjects, {
        canvas,
        ...this.props.activeSelection
      });
      canvas.setActiveObject(activeSelection);
      canvas.requestRenderAll();
    },
    select: obj => {
      const findObject = this.handlers.find(obj);
      if (findObject) {
        this.canvas.discardActiveObject();
        this.canvas.setActiveObject(findObject);
        this.canvas.requestRenderAll();
      }
    },
    selectById: id => {
      const findObject = this.handlers.findById(id);
      if (findObject) {
        this.canvas.discardActiveObject();
        this.canvas.setActiveObject(findObject);
        this.canvas.requestRenderAll();
      }
    },
    selectByObject: object => {
      if (object) {
        this.canvas.discardActiveObject();
        this.canvas.setActiveObject(object);
        this.canvas.requestRenderAll();
      }
    },
    originScaleToResize: (obj, width, height) => {
      if (obj.id === 'workarea') {
        this.handlers.setById(obj.id, 'workareaWidth', obj.width);
        this.handlers.setById(obj.id, 'workareaHeight', obj.height);
      }
      this.workarea.height = height;
      this.workarea.width = width;
      this.canvas.setWidth(width);
      this.canvas.setHeight(height);
      this.canvas.requestRenderAll();
      return;
    },
    scaleToResize: (width, height) => {
      const activeObject = this.canvas.getActiveObject();
      const obj = {
        id: activeObject.id,
        scaleX: width / activeObject.width,
        scaleY: height / activeObject.height
      };
      this.handlers.setObject(obj);
      activeObject.setCoords();
      this.canvas.requestRenderAll();
    },
    importJSON: (json, callback) => {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      let prevLeft = 0;
      let prevTop = 0;
      this.canvas.setBackgroundColor(this.props.canvasOption.backgroundColor);
      const workareaExist = json.filter(obj => obj.id === 'workarea');
      if (!this.workarea) {
        this.workarea = new fabric.Image(null, {
          ...defaultWorkareaOption,
          ...this.props.workareaOption
        });
        this.canvas.add(this.workarea);
        this.objects.push(this.workarea);
      }
      if (!workareaExist.length) {
        this.canvas.centerObject(this.workarea);
        this.workarea.setCoords();
        prevLeft = this.workarea.left;
        prevTop = this.workarea.top;
      } else {
        const workarea = workareaExist[0];
        prevLeft = workarea.left;
        prevTop = workarea.top;
        this.workarea.set(workarea);
        this.canvas.centerObject(this.workarea);
        this.workareaHandlers.setImage(workarea.src, true);
        this.workarea.setCoords();
      }
      setTimeout(() => {
        json.forEach(obj => {
          if (workareaExist.length && obj.id === 'workarea') {
            prevLeft = obj.left;
            prevTop = obj.top;
            this.workarea.set(obj);
            this.canvas.centerObject(this.workarea);
            this.workareaHandlers.setImage(obj.src, true);
            this.workarea.setCoords();
            return;
          }
          const canvasWidth = this.canvas.getWidth();
          const canvasHeight = this.canvas.getHeight();
          const {
            width,
            height,
            scaleX,
            scaleY,
            layout,
            left,
            top
          } = this.workarea;
          if (layout === 'fullscreen') {
            const leftRatio = canvasWidth / (width * scaleX);
            const topRatio = canvasHeight / (height * scaleY);
            obj.left *= leftRatio;
            obj.top *= topRatio;
            obj.scaleX *= leftRatio;
            obj.scaleY *= topRatio;
          } else {
            const diffLeft = left - prevLeft;
            const diffTop = top - prevTop;
            obj.left += diffLeft;
            obj.top += diffTop;
          }
          this.handlers.add(obj, false, true);
          this.canvas.requestRenderAll();
        });
        if (callback) {
          callback(this.canvas);
        }
      }, 300);
      this.canvas.setZoom(1);
    },
    exportJSON: () =>
      this.canvas.toDatalessJSON(this.props.propertiesToInclude),
    getObjects: () =>
      this.canvas.getObjects().filter(obj => {
        if (obj.id === 'workarea') {
          return false;
        } else if (obj.id === 'grid') {
          return false;
        } else if (obj.superType === 'port') {
          return false;
        } else if (!obj.id) {
          return false;
        }
        return true;
      }),
    bringForward: () => {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        this.canvas.bringForward(activeObject);
        this.transactionHandlers.save(activeObject, 'modified');
        const { onModified } = this.props;
        if (onModified) {
          onModified(activeObject);
        }
      }
    },
    bringToFront: () => {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        this.canvas.bringToFront(activeObject);
        this.transactionHandlers.save(activeObject, 'modified');
        const { onModified } = this.props;
        if (onModified) {
          onModified(activeObject);
        }
      }
    },
    sendBackwards: () => {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        if (this.canvas.getObjects()[1].id === activeObject.id) {
          return;
        }
        this.canvas.sendBackwards(activeObject);
        this.transactionHandlers.save(activeObject, 'modified');
        const { onModified } = this.props;
        if (onModified) {
          onModified(activeObject);
        }
      }
    },
    sendToBack: () => {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        this.canvas.sendToBack(activeObject);
        this.canvas.sendToBack(this.canvas.getObjects()[1]);
        this.transactionHandlers.save(activeObject, 'modified');
        const { onModified } = this.props;
        if (onModified) {
          onModified(activeObject);
        }
      }
    },
    clear: (workarea = false) => {
      const { canvas } = this;
      const ids = canvas.getObjects().reduce((prev, curr) => {
        return prev;
      }, []);
      this.elementHandlers.removeByIds(ids);
      if (workarea) {
        canvas.clear();
        this.workarea = null;
      } else {
        canvas.getObjects().forEach(obj => {
          if (obj.id !== 'workarea') {
            canvas.remove(obj);
          }
        });
      }
    },
    toGroup: () => {
      const { canvas } = this;
      if (!canvas.getActiveObject()) {
        return;
      }
      if (canvas.getActiveObject().type !== 'activeSelection') {
        return;
      }
      const group = canvas.getActiveObject().toGroup();
      group.set({
        id: uuid(),
        name: 'New group',
        ...this.props.defaultOptions
      });
      const { onSelect } = this.props;
      if (onSelect) {
        onSelect(group);
      }
      canvas.requestRenderAll();
    },
    toActiveSelection: () => {
      const { canvas } = this;
      if (!canvas.getActiveObject()) {
        return;
      }
      if (canvas.getActiveObject().type !== 'group') {
        return;
      }
      const activeObject = canvas.getActiveObject().toActiveSelection();
      const { onSelect } = this.props;
      if (onSelect) {
        onSelect(activeObject);
      }
      canvas.requestRenderAll();
    },
    getOriginObjects: () => this.objects,
    findOriginById: id => {
      let findObject;
      const exist = this.objects.some(obj => {
        if (obj.id === id) {
          findObject = obj;
          return true;
        }
        return false;
      });
      if (!exist) {
        return exist;
      }
      return findObject;
    },
    findOriginByIdWithIndex: id => {
      let findObject;
      let index;
      const exist = this.objects.some((obj, i) => {
        if (obj.id === id) {
          findObject = obj;
          index = i;
          return true;
        }
        return false;
      });
      if (!exist) {
        return exist;
      }
      return {
        object: findObject,
        index
      };
    },
    removeOriginById: id => {
      const object = this.handlers.findOriginByIdWithIndex(id);
      if (object) {
        this.objects.splice(object.index, 1);
      }
    },
    getImage: (
      option = {
        name: i18n.t('action.save-file-name'),
        format: 'png',
        quality: 1
      }
    ) => {
      return this.canvas.toDataURL();
    },
    saveCanvasImage: (
      option = {
        name: i18n.t('action.save-file-name'),
        format: 'png',
        quality: 1
      }
    ) => {
      const dataUrl = this.canvas.toDataURL(option);
      if (dataUrl) {
        const anchorEl = document.createElement('a');
        anchorEl.href = dataUrl;
        anchorEl.download = `${option.name}.png`;
        document.body.appendChild(anchorEl); // required for firefox
        anchorEl.click();
        anchorEl.remove();
      }
    }
  };

  cropHandlers = {
    validType: () => {
      const activeObject = this.canvas.getActiveObject();
      if (!activeObject) {
        return true;
      }
      if (activeObject.type === 'image') {
        return false;
      }
      return true;
    },
    start: () => {
      if (this.cropHandlers.validType()) {
        return;
      }
      this.interactionMode = 'crop';
      this.cropObject = this.canvas.getActiveObject();
      const { left, top } = this.cropObject;
      this.cropRect = new fabric.Rect({
        width: this.cropObject.width,
        height: this.cropObject.height,
        scaleX: this.cropObject.scaleX,
        scaleY: this.cropObject.scaleY,
        originX: 'left',
        originY: 'top',
        left,
        top,
        hasRotatingPoint: false,
        fill: 'rgba(0, 0, 0, 0.2)'
      });
      this.canvas.add(this.cropRect);
      this.canvas.setActiveObject(this.cropRect);
      this.cropObject.selectable = false;
      this.cropObject.evented = false;
      this.canvas.requestRenderAll();
    },
    finish: () => {
      const { left, top, width, height, scaleX, scaleY } = this.cropRect;
      const croppedImg = this.cropObject.toDataURL({
        left: left - this.cropObject.left,
        top: top - this.cropObject.top,
        width: width * scaleX,
        height: height * scaleY
      });
      this.handlers.setImage(this.cropObject, croppedImg);
      this.cropHandlers.cancel();
    },
    cancel: () => {
      this.interactionMode = 'selection';
      this.cropObject.selectable = true;
      this.cropObject.evented = true;
      this.canvas.setActiveObject(this.cropObject);
      this.canvas.remove(this.cropRect);
      this.cropRect = null;
      // this.cropObject = null;
      this.canvas.requestRenderAll();
    },
    resize: opt => {
      const {
        target,
        transform: { original, corner }
      } = opt;
      const { left, top, width, height, scaleX, scaleY } = target;
      const {
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
        scaleX: cropScaleX,
        scaleY: cropScaleY
      } = this.cropObject;
      if (corner === 'tl') {
        if (Math.round(cropLeft) > Math.round(left)) {
          // left
          const originRight = Math.round(cropLeft + cropWidth);
          const targetRight = Math.round(
            target.getBoundingRect().left + target.getBoundingRect().width
          );
          const diffRightRatio = 1 - (originRight - targetRight) / cropWidth;
          target.set({
            left: cropLeft,
            scaleX: diffRightRatio > 1 ? 1 : diffRightRatio
          });
        }
        if (Math.round(cropTop) > Math.round(top)) {
          // top
          const originBottom = Math.round(cropTop + cropHeight);
          const targetBottom = Math.round(
            target.getBoundingRect().top + target.getBoundingRect().height
          );
          const diffBottomRatio =
            1 - (originBottom - targetBottom) / cropHeight;
          target.set({
            top: cropTop,
            scaleY: diffBottomRatio > 1 ? 1 : diffBottomRatio
          });
        }
      } else if (corner === 'bl') {
        if (Math.round(cropLeft) > Math.round(left)) {
          // left
          const originRight = Math.round(cropLeft + cropWidth);
          const targetRight = Math.round(
            target.getBoundingRect().left + target.getBoundingRect().width
          );
          const diffRightRatio = 1 - (originRight - targetRight) / cropWidth;
          target.set({
            left: cropLeft,
            scaleX: diffRightRatio > 1 ? 1 : diffRightRatio
          });
        }
        if (
          Math.round(
            cropTop + cropHeight * cropScaleY <
              Math.round(top + height * scaleY)
          )
        ) {
          // bottom
          const diffTopRatio = 1 - (original.top - cropTop) / cropHeight;
          target.set({
            top: original.top,
            scaleY: diffTopRatio > 1 ? 1 : diffTopRatio
          });
        }
      } else if (corner === 'tr') {
        if (
          Math.round(cropLeft + cropWidth * cropScaleX) <
          Math.round(left + width * scaleX)
        ) {
          // right
          const diffLeftRatio = 1 - (original.left - cropLeft) / cropWidth;
          target.set({
            left: original.left,
            scaleX: diffLeftRatio > 1 ? 1 : diffLeftRatio
          });
        }
        if (Math.round(cropTop) > Math.round(top)) {
          // top
          const originBottom = Math.round(cropTop + cropHeight);
          const targetBottom = Math.round(
            target.getBoundingRect().top + target.getBoundingRect().height
          );
          const diffBottomRatio =
            1 - (originBottom - targetBottom) / cropHeight;
          target.set({
            top: cropTop,
            scaleY: diffBottomRatio > 1 ? 1 : diffBottomRatio
          });
        }
      } else if (corner === 'br') {
        if (
          Math.round(cropLeft + cropWidth * cropScaleX) <
          Math.round(left + width * scaleX)
        ) {
          // right
          const diffLeftRatio = 1 - (original.left - cropLeft) / cropWidth;
          target.set({
            left: original.left,
            scaleX: diffLeftRatio > 1 ? 1 : diffLeftRatio
          });
        }
        if (
          Math.round(
            cropTop + cropHeight * cropScaleY <
              Math.round(top + height * scaleY)
          )
        ) {
          // bottom
          const diffTopRatio = 1 - (original.top - cropTop) / cropHeight;
          target.set({
            top: original.top,
            scaleY: diffTopRatio > 1 ? 1 : diffTopRatio
          });
        }
      } else if (corner === 'ml') {
        if (Math.round(cropLeft) > Math.round(left)) {
          // left
          const originRight = Math.round(cropLeft + cropWidth);
          const targetRight = Math.round(
            target.getBoundingRect().left + target.getBoundingRect().width
          );
          const diffRightRatio = 1 - (originRight - targetRight) / cropWidth;
          target.set({
            left: cropLeft,
            scaleX: diffRightRatio > 1 ? 1 : diffRightRatio
          });
        }
      } else if (corner === 'mt') {
        if (Math.round(cropTop) > Math.round(top)) {
          // top
          const originBottom = Math.round(cropTop + cropHeight);
          const targetBottom = Math.round(
            target.getBoundingRect().top + target.getBoundingRect().height
          );
          const diffBottomRatio =
            1 - (originBottom - targetBottom) / cropHeight;
          target.set({
            top: cropTop,
            scaleY: diffBottomRatio > 1 ? 1 : diffBottomRatio
          });
        }
      } else if (corner === 'mb') {
        if (
          Math.round(
            cropTop + cropHeight * cropScaleY <
              Math.round(top + height * scaleY)
          )
        ) {
          // bottom
          const diffTopRatio = 1 - (original.top - cropTop) / cropHeight;
          target.set({
            top: original.top,
            scaleY: diffTopRatio > 1 ? 1 : diffTopRatio
          });
        }
      } else if (corner === 'mr') {
        if (
          Math.round(cropLeft + cropWidth * cropScaleX) <
          Math.round(left + width * scaleX)
        ) {
          // right
          const diffLeftRatio = 1 - (original.left - cropLeft) / cropWidth;
          target.set({
            left: original.left,
            scaleX: diffLeftRatio > 1 ? 1 : diffLeftRatio
          });
        }
      }
    },
    moving: opt => {
      const { target } = opt;
      const { left, top, width, height, scaleX, scaleY } = target;
      const {
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight
      } = this.cropObject.getBoundingRect();
      const movedTop = () => {
        if (Math.round(cropTop) >= Math.round(top)) {
          target.set({
            top: cropTop
          });
        } else if (
          Math.round(cropTop + cropHeight) <= Math.round(top + height * scaleY)
        ) {
          target.set({
            top: cropTop + cropHeight - height * scaleY
          });
        }
      };
      if (Math.round(cropLeft) >= Math.round(left)) {
        target.set({
          left: Math.max(left, cropLeft)
        });
        movedTop();
      } else if (
        Math.round(cropLeft + cropWidth) <= Math.round(left + width * scaleX)
      ) {
        target.set({
          left: cropLeft + cropWidth - width * scaleX
        });
        movedTop();
      } else if (Math.round(cropTop) >= Math.round(top)) {
        target.set({
          top: cropTop
        });
      } else if (
        Math.round(cropTop + cropHeight) <= Math.round(top + height * scaleY)
      ) {
        target.set({
          top: cropTop + cropHeight - height * scaleY
        });
      }
    }
  };

  modeHandlers = {
    selection: callback => {
      this.interactionMode = 'selection';
      this.canvas.selection = this.props.canvasOption.selection;
      this.canvas.defaultCursor = 'default';
      this.workarea.hoverCursor = 'default';
      this.canvas.getObjects().forEach(obj => {
        if (obj.id !== 'workarea') {
          if (obj.id === 'grid') {
            obj.selectable = false;
            obj.evented = false;
            return;
          }
          if (callback) {
            const ret = callback(obj);
            if (typeof ret === 'object') {
              obj.selectable = ret.selectable;
              obj.evented = ret.evented;
            } else {
              obj.selectable = ret;
              obj.evented = ret;
            }
          } else {
            obj.selectable = true;
            obj.evented = true;
          }
        }
      });
      this.canvas.requestRenderAll();
    },
    grab: callback => {
      this.interactionMode = 'grab';
      this.canvas.selection = false;
      this.canvas.defaultCursor = 'grab';
      this.workarea.hoverCursor = 'grab';
      this.canvas.getObjects().forEach(obj => {
        if (obj.id !== 'workarea') {
          if (callback) {
            const ret = callback(obj);
            if (typeof ret === 'object') {
              obj.selectable = ret.selectable;
              obj.evented = ret.evented;
            } else {
              obj.selectable = ret;
              obj.evented = ret;
            }
          } else {
            obj.selectable = false;
            obj.evented = this.props.editable ? false : true;
          }
        }
      });
      this.canvas.requestRenderAll();
    },
    drawing: (callback, type) => {
      this.interactionMode = type;
      this.canvas.selection = false;
      this.canvas.defaultCursor = 'pointer';
      this.workarea.hoverCursor = 'pointer';
      this.canvas.getObjects().forEach(obj => {
        if (obj.id !== 'workarea') {
          if (callback) {
            const ret = callback(obj);
            if (typeof ret === 'object') {
              obj.selectable = ret.selectable;
              obj.evented = ret.evented;
            } else {
              obj.selectable = ret;
              obj.evented = ret;
            }
          } else {
            obj.selectable = false;
            obj.evented = this.props.editable ? false : true;
          }
        }
      });
      this.canvas.requestRenderAll();
    },
    moving: e => {
      const delta = new fabric.Point(e.movementX, e.movementY);
      this.canvas.relativePan(delta);
    }
  };

  workareaHandlers = {
    setLayout: value => {
      this.workarea.set('layout', value);
      const { canvas } = this;
      const { _element } = this.workarea;
      let scaleX = 1;
      let scaleY = 1;
      const isFixed = value === 'fixed';
      const isResponsive = value === 'responsive';
      const isFullscreen = value === 'fullscreen';
      if (_element) {
        if (isFixed) {
          scaleX = this.workarea.workareaWidth / _element.width;
          scaleY = this.workarea.workareaHeight / _element.height;
        } else if (isResponsive) {
          scaleX = canvas.getScaledWidth() / _element.width;
          scaleY = canvas.getScaledHeight() / _element.height;
          if (_element.height > _element.width) {
            scaleX = scaleY;
          } else {
            scaleY = scaleX;
          }
        } else {
          scaleX = canvas.getScaledWidth() / _element.width;
          scaleY = canvas.getScaledHeight() / _element.height;
        }
      }
      canvas.getObjects().forEach(obj => {
        if (obj.id !== 'workarea') {
          const objScaleX = !isFullscreen ? 1 : scaleX;
          const objScaleY = !isFullscreen ? 1 : scaleY;
          const objWidth = obj.width * objScaleX * canvas.getZoom();
          const objHeight = obj.height * objScaleY * canvas.getZoom();
          const el = this.elementHandlers.findById(obj.id);
          this.elementHandlers.setSize(el, objWidth, objHeight);
          if (obj.player) {
            obj.player.setPlayerSize(objWidth, objHeight);
          }
          obj.set({
            scaleX: !isFullscreen ? 1 : objScaleX,
            scaleY: !isFullscreen ? 1 : objScaleY
          });
        }
      });
      if (isResponsive) {
        if (_element) {
          const center = canvas.getCenter();
          const point = {
            x: center.left,
            y: center.top
          };
          this.workarea.set({
            scaleX: 1,
            scaleY: 1
          });
          this.zoomHandlers.zoomToPoint(point, scaleX);
        } else {
          this.workarea.set({
            width: 0,
            height: 0,
            backgroundColor: 'rgba(255, 255, 255, 0)'
          });
        }
        canvas.centerObject(this.workarea);
        canvas.requestRenderAll();
        return;
      }
      if (_element) {
        this.workarea.set({
          width: _element.width,
          height: _element.height,
          scaleX,
          scaleY
        });
      } else {
        const width = isFixed
          ? this.workarea.workareaWidth
          : this.canvas.getWidth();
        const height = isFixed
          ? this.workarea.workareaHeight
          : this.canvas.getHeight();
        this.workarea.set({
          width,
          height
        });
        if (isFixed) {
          canvas.centerObject(this.workarea);
        } else {
          this.workarea.set({
            left: 0,
            top: 0,
            backgroundColor: 'rgba(255, 255, 255, 1)'
          });
        }
      }
      canvas.centerObject(this.workarea);
      const center = canvas.getCenter();
      const point = {
        x: center.left,
        y: center.top
      };
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.zoomHandlers.zoomToPoint(point, 1);
      canvas.requestRenderAll();
    },
    setResponsiveImage: (src, loaded) => {
      const { canvas, workarea, zoomHandlers } = this;
      const { editable } = this.props;
      const imageFromUrl = source => {
        fabric.Image.fromURL(source, img => {
          let scaleX = canvas.getWidth() / img.width;
          let scaleY = canvas.getHeight() / img.height;
          if (img.height > img.width) {
            scaleX = scaleY;
            if (canvas.getWidth() < img.width * scaleX) {
              scaleX = scaleX * (canvas.getWidth() / (img.width * scaleX));
            }
          } else {
            scaleY = scaleX;
            if (canvas.getHeight() < img.height * scaleX) {
              scaleX = scaleX * (canvas.getHeight() / (img.height * scaleX));
            }
          }
          img.set({
            originX: 'left',
            originY: 'top'
          });
          workarea.set({
            ...img,
            selectable: false
          });
          if (!source) {
            scaleX = 1;
          }
          canvas.centerObject(workarea);
          if (editable && !loaded) {
            canvas.getObjects().forEach((obj, index) => {
              if (index !== 0) {
                const objWidth = obj.width * scaleX;
                const objHeight = obj.height * scaleY;
                const el = this.elementHandlers.findById(obj.id);
                this.elementHandlers.setSize(el, objWidth, objHeight);
                if (obj.player) {
                  obj.player.setPlayerSize(objWidth, objHeight);
                }
                obj.set({
                  scaleX: 1,
                  scaleY: 1
                });
                obj.setCoords();
              }
            });
          }
          const center = canvas.getCenter();
          const point = {
            x: center.left,
            y: center.top
          };
          canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          zoomHandlers.zoomToPoint(point, scaleX);
          canvas.requestRenderAll();
        });
      };
      if (!src) {
        workarea.set({
          src
        });
        imageFromUrl(src);
        return;
      }
      if (typeof src === 'string') {
        workarea.set({
          src
        });
        imageFromUrl(src);
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        workarea.set({
          file: src
        });
        imageFromUrl(e.target.result);
      };
      reader.readAsDataURL(src);
    },
    setImage: (src, loaded = false) => {
      const { canvas, workarea, zoomHandlers, workareaHandlers } = this;
      const { editable } = this.props;
      if (workarea.layout === 'responsive') {
        workareaHandlers.setResponsiveImage(src, loaded);
        return;
      }
      const imageFromUrl = source => {
        fabric.Image.fromURL(source, img => {
          let width = canvas.getWidth();
          let height = canvas.getHeight();
          if (workarea.layout === 'fixed') {
            width = workarea.width * workarea.scaleX;
            height = workarea.height * workarea.scaleY;
          }
          let scaleX = 1;
          let scaleY = 1;
          if (source) {
            scaleX = width / img.width;
            scaleY = height / img.height;
            img.set({
              originX: 'left',
              originY: 'top',
              scaleX,
              scaleY
            });
            workarea.set({
              ...img,
              selectable: false
            });
          } else {
            workarea.set({
              _element: null,
              selectable: false
            });
          }
          canvas.centerObject(workarea);
          if (editable && !loaded) {
            const { layout } = workarea;
            canvas.getObjects().forEach((obj, index) => {
              if (index !== 0) {
                scaleX = layout !== 'fullscreen' ? 1 : scaleX;
                scaleY = layout !== 'fullscreen' ? 1 : scaleY;
                const objWidth = obj.width * scaleX;
                const objHeight = obj.height * scaleY;
                const el = this.elementHandlers.findById(obj.id);
                this.elementHandlers.setSize(el, width, height);
                if (obj.player) {
                  obj.player.setPlayerSize(objWidth, objHeight);
                }
                obj.set({
                  scaleX,
                  scaleY
                });
                obj.setCoords();
              }
            });
          }
          const center = canvas.getCenter();
          const point = {
            x: center.left,
            y: center.top
          };
          canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          zoomHandlers.zoomToPoint(point, 1);
          canvas.requestRenderAll();
        });
      };
      if (!src) {
        workarea.set({
          src
        });
        imageFromUrl(src);
        return;
      }
      if (typeof src === 'string') {
        workarea.set({
          src
        });
        imageFromUrl(src);
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        workarea.set({
          file: src
        });
        imageFromUrl(e.target.result);
      };
      reader.readAsDataURL(src);
    }
  };

  elementHandlers = {
    setById: (id, source) => {
      const findObject = this.handlers.findById(id);
      if (!findObject) {
        return;
      }
    },
    set: (obj, source) => {
      this.elementHandlers.createElement(obj, source);
    },
    createElement: (obj, code) => {
      obj.set('code', code);
      const { editable } = this.props;
      const { left, top } = obj.getBoundingRect();
      const { id, scaleX, scaleY, angle } = obj;
      if (editable) {
        this.elementHandlers.removeById(id);
        this.elementHandlers.removeStyleById(id);
        this.elementHandlers.removeScriptById(id);
      }
      const zoom = this.canvas.getZoom();
      const width = obj.width * scaleX * zoom;
      const height = obj.height * scaleY * zoom;
      const element = fabric.util.makeElement('div', {
        id: `${id}_container`,
        style: `transform: rotate(${angle}deg);
                        width: ${width}px;
                        height: ${height}px;
                        left: ${left}px;
                        top: ${top}px;
                        position: absolute;`
      });
      const { html, css, js } = code;
      if (code.css && code.css.length) {
        const styleElement = document.createElement('style');
        styleElement.id = `${id}_style`;
        styleElement.type = 'text/css';
        styleElement.innerHTML = css;
        document.head.appendChild(styleElement);
      }
      this.container.current.appendChild(element);
      if (code.js && code.js.length) {
        const script = document.createElement('script');
        script.id = `${id}_script`;
        script.type = 'text/javascript';
        script.innerHTML = js;
        element.appendChild(script);
      }
      element.innerHTML = html;
      if (editable) {
        this.elementHandlers.draggable(element, obj);
        element.addEventListener(
          'mousedown',
          e => {
            this.canvas.setActiveObject(obj);
            this.canvas.requestRenderAll();
          },
          false
        );
      }
      obj.setCoords();
    },
    findScriptById: id => document.getElementById(`${id}_script`),
    findStyleById: id => document.getElementById(`${id}_style`),
    findById: id => document.getElementById(`${id}_container`),
    remove: el => {
      if (!el) {
        return;
      }
      this.container.current.removeChild(el);
    },
    removeStyleById: id => {
      const style = this.elementHandlers.findStyleById(id);
      if (!style) {
        return;
      }
      document.head.removeChild(style);
    },
    removeScriptById: id => {
      const style = this.elementHandlers.findScriptById(id);
      if (!style) {
        return;
      }
      document.head.removeChild(style);
    },
    removeById: id => {
      const el = this.elementHandlers.findById(id);
      this.elementHandlers.remove(el);
    },
    removeByIds: ids => {
      ids.forEach(id => {
        this.elementHandlers.removeById(id);
        this.elementHandlers.removeStyleById(id);
        this.elementHandlers.removeScriptById(id);
      });
    },
    setPosition: (el, left, top) => {
      if (!el) {
        return false;
      }
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.transform = null;
      el.setAttribute('data-x', 0);
      el.setAttribute('data-y', 0);
      return el;
    },
    setSize: (el, width, height) => {
      if (!el) {
        return false;
      }
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      return el;
    },
    setScale: (el, x, y) => {
      if (!el) {
        return false;
      }
      el.style.transform = `scale(${x}, ${y})`;
      return el;
    },
    setZoom: (el, zoom) => {
      if (!el) {
        return false;
      }
      el.style.zoom = zoom;
      return el;
    },
    draggable: (el, obj) => {
      if (!el) {
        return false;
      }
      return el.draggable({
        restrict: {
          restriction: 'parent'
          // elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
        },
        onmove: e => {
          const { dx, dy, target } = e;
          // keep the dragged position in the data-x/data-y attributes
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + dy;
          // translate the element
          target.style.webkitTransform = `translate(${x}px, ${y}px)`;
          target.style.transform = `translate(${x}px, ${y}px)`;
          // update the posiion attributes
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
          // update canvas object the position
          obj.set({
            left: obj.left + dx,
            top: obj.top + dy
          });
          obj.setCoords();
          this.canvas.requestRenderAll();
        },
        onend: () => {
          if (this.props.onSelect) {
            this.props.onSelect(obj);
          }
        }
      });
    }
  };

  drawingHandlers = {
    polygon: {
      init: () => {
        this.modeHandlers.drawing(null, 'polygon');
        this.pointArray = [];
        this.lineArray = [];
        this.activeLine = null;
        this.activeShape = null;
      },
      finish: () => {
        this.pointArray.forEach(point => {
          this.canvas.remove(point);
        });
        this.lineArray.forEach(line => {
          this.canvas.remove(line);
        });
        this.canvas.remove(this.activeLine);
        this.canvas.remove(this.activeShape);
        this.pointArray = [];
        this.lineArray = [];
        this.activeLine = null;
        this.activeShape = null;
        this.canvas.requestRenderAll();
        this.modeHandlers.selection();
      },
      addPoint: opt => {
        const id = uuid();
        const { e, absolutePointer } = opt;
        const { x, y } = absolutePointer;
        const circle = new fabric.Circle({
          id,
          radius: 3,
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 0.5,
          left: x,
          top: y,
          selectable: false,
          hasBorders: false,
          hasControls: false,
          originX: 'center',
          originY: 'center',
          hoverCursor: 'pointer'
        });
        if (!this.pointArray.length) {
          circle.set({
            fill: 'red'
          });
        }
        const points = [x, y, x, y];
        const line = new fabric.Line(points, {
          strokeWidth: 2,
          fill: '#999999',
          stroke: '#999999',
          class: 'line',
          originX: 'center',
          originY: 'center',
          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false
        });
        if (this.activeShape) {
          const position = this.canvas.getPointer(e);
          const activeShapePoints = this.activeShape.get('points');
          activeShapePoints.push({
            x: position.x,
            y: position.y
          });
          const polygon = new fabric.Polygon(activeShapePoints, {
            stroke: '#000',
            strokeWidth: 1,
            fill: '#000',
            opacity: 0.1,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false
          });
          this.canvas.remove(this.activeShape);
          this.canvas.add(polygon);
          this.activeShape = polygon;
          this.canvas.requestRenderAll();
        } else {
          const polyPoint = [{ x, y }];
          const polygon = new fabric.Polygon(polyPoint, {
            stroke: '#000',
            strokeWidth: 1,
            fill: '#000',
            opacity: 0.9,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false
          });
          this.activeShape = polygon;
          this.canvas.add(polygon);
        }
        this.activeLine = line;
        this.pointArray.push(circle);
        this.lineArray.push(line);
        this.canvas.add(line);
        this.canvas.add(circle);
      },
      generate: pointArray => {
        const points = [];
        const id = uuid();
        pointArray.forEach(point => {
          points.push({
            x: point.left,
            y: point.top
          });
          this.canvas.remove(point);
        });
        this.lineArray.forEach(line => {
          this.canvas.remove(line);
        });
        this.canvas.remove(this.activeShape).remove(this.activeLine);
        const option = {
          id,
          points,
          type: 'polygon',
          stroke: '#000',
          strokeWidth: 1,
          fill: '#000',
          opacity: 1,
          objectCaching: !this.props.editable,
          name: 'New polygon',
          superType: 'drawing'
        };
        this.handlers.add(option, false);
        this.pointArray = [];
        this.activeLine = null;
        this.activeShape = null;
        this.modeHandlers.selection();
      },
      // TODO... polygon resize
      createResize: (target, points) => {
        points.forEach((point, index) => {
          const { x, y } = point;
          const circle = new fabric.Circle({
            name: index,
            radius: 3,
            fill: '#ffffff',
            stroke: '#333333',
            strokeWidth: 0.5,
            left: x,
            top: y,
            hasBorders: false,
            hasControls: false,
            originX: 'center',
            originY: 'center',
            hoverCursor: 'pointer',
            parentId: target.id
          });
          this.pointArray.push(circle);
        });
        const group = [target].concat(this.pointArray);
        this.canvas.add(
          new fabric.Group(group, { type: 'polygon', id: uuid() })
        );
      },
      removeResize: () => {
        if (this.pointArray) {
          this.pointArray.forEach(point => {
            this.canvas.remove(point);
          });
          this.pointArray = [];
        }
      },
      movingResize: (target, e) => {
        const points = target.diffPoints || target.points;
        const diffPoints = [];
        points.forEach(point => {
          diffPoints.push({
            x: point.x + e.movementX,
            y: point.y + e.movementY
          });
        });
        target.set({
          diffPoints
        });
        this.canvas.requestRenderAll();
      }
    },
    line: {
      init: () => {
        this.modeHandlers.drawing(null, 'line');
        this.pointArray = [];
        this.activeLine = null;
      },
      finish: () => {
        this.pointArray.forEach(point => {
          this.canvas.remove(point);
        });
        this.canvas.remove(this.activeLine);
        this.pointArray = [];
        this.activeLine = null;
        this.canvas.requestRenderAll();
        this.modeHandlers.selection();
      },
      addPoint: opt => {
        const { absolutePointer } = opt;
        const { x, y } = absolutePointer;
        const circle = new fabric.Circle({
          radius: 3,
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 0.5,
          left: x,
          top: y,
          selectable: false,
          hasBorders: false,
          hasControls: false,
          originX: 'center',
          originY: 'center',
          hoverCursor: 'pointer'
        });
        if (!this.pointArray.length) {
          circle.set({
            fill: 'red'
          });
        }
        const points = [x, y, x, y];
        this.activeLine = new fabric.Line(points, {
          strokeWidth: 2,
          fill: '#999999',
          stroke: '#999999',
          class: 'line',
          originX: 'center',
          originY: 'center',
          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false
        });
        this.pointArray.push(circle);
        this.canvas.add(this.activeLine);
        this.canvas.add(circle);
      },
      generate: opt => {
        const { absolutePointer } = opt;
        const { x, y } = absolutePointer;
        let points = [];
        const id = uuid();
        this.pointArray.forEach(point => {
          points = points.concat(point.left, point.top, x, y);
          this.canvas.remove(point);
        });
        this.canvas.remove(this.activeLine);
        const option = {
          id,
          points,
          type: 'line',
          stroke: 'rgba(0, 0, 0, 1)',
          strokeWidth: 3,
          opacity: 1,
          objectCaching: !this.props.editable,
          name: 'New line',
          superType: 'drawing'
        };
        this.handlers.add(option, false);
        this.pointArray = [];
        this.activeLine = null;
        this.modeHandlers.selection();
      }
    },
    arrow: {
      init: () => {
        this.modeHandlers.drawing(null, 'arrow');
        this.pointArray = [];
        this.activeLine = null;
      },
      finish: () => {
        this.pointArray.forEach(point => {
          this.canvas.remove(point);
        });
        this.canvas.remove(this.activeLine);
        this.pointArray = [];
        this.activeLine = null;
        this.canvas.requestRenderAll();
        this.modeHandlers.selection();
      },
      addPoint: opt => {
        const { absolutePointer } = opt;
        const { x, y } = absolutePointer;
        const circle = new fabric.Circle({
          radius: 3,
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 0.5,
          left: x,
          top: y,
          selectable: false,
          hasBorders: false,
          hasControls: false,
          originX: 'center',
          originY: 'center',
          hoverCursor: 'pointer'
        });
        if (!this.pointArray.length) {
          circle.set({
            fill: 'red'
          });
        }
        const points = [x, y, x, y];
        this.activeLine = new Arrow(points, {
          strokeWidth: 2,
          fill: '#999999',
          stroke: '#999999',
          class: 'line',
          originX: 'center',
          originY: 'center',
          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false
        });
        this.pointArray.push(circle);
        this.canvas.add(this.activeLine);
        this.canvas.add(circle);
      },
      generate: opt => {
        const { absolutePointer } = opt;
        const { x, y } = absolutePointer;
        let points = [];
        const id = uuid();
        this.pointArray.forEach(point => {
          points = points.concat(point.left, point.top, x, y);
          this.canvas.remove(point);
        });
        this.canvas.remove(this.activeLine);
        const option = {
          id,
          points,
          type: 'arrow',
          stroke: 'rgba(0, 0, 0, 1)',
          strokeWidth: 3,
          opacity: 1,
          objectCaching: !this.props.editable,
          name: 'New line',
          superType: 'drawing'
        };
        this.handlers.add(option, false);
        this.pointArray = [];
        this.activeLine = null;
        this.modeHandlers.selection();
      }
    },
    pencil: {
      init: () => {
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
        this.interactionMode = 'drawing';
        this.canvas.freeDrawingBrush.color = '#000';
        this.canvas.freeDrawingBrush.width = 8;
      },
      generate: opt => {
        this.canvas.getObjects().map(obj => {
          if (!obj.id) {
            obj.id = uuid();
          }
        });
        this.modeHandlers.selection();
        this.drawingHandlers.pencil.finish();
      },
      finish: () => {
        this.canvas.isDrawingMode = false;
      }
    },
    fill: {
      init: () => {
        //this.canvas.isApplyingColor = true;
        //this.color = this.canvas.backgroundColor;
      },
      finish: () => {
        this.canvas.isApplyingColor = false;
      },
      setFillMode: () => {},
      setColor: color => {
        this.canvas.setBackgroundColor(color);
        this.workarea.setColor(color);
        this.canvas.requestRenderAll();
      }
    }
  };

  alignmentHandlers = {
    left: () => {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && activeObject.type === 'activeSelection') {
        const activeObjectLeft = -(activeObject.width / 2);
        activeObject.forEachObject(obj => {
          obj.set({
            left: activeObjectLeft
          });
          obj.setCoords();
          this.canvas.requestRenderAll();
        });
      }
    },
    center: () => {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && activeObject.type === 'activeSelection') {
        activeObject.forEachObject(obj => {
          obj.set({
            left: 0 - (obj.width * obj.scaleX) / 2
          });
          obj.setCoords();
          this.canvas.requestRenderAll();
        });
      }
    },
    right: () => {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && activeObject.type === 'activeSelection') {
        const activeObjectLeft = activeObject.width / 2;
        activeObject.forEachObject(obj => {
          obj.set({
            left: activeObjectLeft - obj.width * obj.scaleX
          });
          obj.setCoords();
          this.canvas.requestRenderAll();
        });
      }
    }
  };

  zoomHandlers = {
    zoomToPoint: (point, zoom) => {
      const { onZoom, minZoom, maxZoom } = this.props;
      let zoomRatio = zoom;
      if (zoom <= minZoom / 100) {
        zoomRatio = minZoom / 100;
      } else if (zoom >= maxZoom / 100) {
        zoomRatio = maxZoom / 100;
      }
      this.canvas.zoomToPoint(point, zoomRatio);
      if (onZoom) {
        onZoom(zoomRatio);
      }
    },
    zoomOneToOne: () => {
      const center = this.canvas.getCenter();
      const point = {
        x: center.left,
        y: center.top
      };
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.zoomHandlers.zoomToPoint(point, 1);
    },
    zoomToFit: () => {
      let scaleX;
      let scaleY;
      scaleX = this.canvas.getWidth() / this.workarea.width;
      scaleY = this.canvas.getHeight() / this.workarea.height;
      if (this.workarea.height > this.workarea.width) {
        scaleX = scaleY;
        if (this.canvas.getWidth() < this.workarea.width * scaleX) {
          scaleX =
            scaleX * (this.canvas.getWidth() / (this.workarea.width * scaleX));
        }
      } else {
        scaleY = scaleX;
        if (this.canvas.getHeight() < this.workarea.height * scaleX) {
          scaleX =
            scaleX *
            (this.canvas.getHeight() / (this.workarea.height * scaleX));
        }
      }
      const center = this.canvas.getCenter();
      const point = {
        x: center.left,
        y: center.top
      };
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      this.zoomHandlers.zoomToPoint(point, scaleX);
    },
    zoomIn: () => {
      let zoomRatio = this.canvas.getZoom();
      zoomRatio += 0.05;
      const center = this.canvas.getCenter();
      const point = {
        x: center.left,
        y: center.top
      };
      this.zoomHandlers.zoomToPoint(point, zoomRatio);
    },
    zoomOut: () => {
      let zoomRatio = this.canvas.getZoom();
      zoomRatio -= 0.05;
      const center = this.canvas.getCenter();
      const point = {
        x: center.left,
        y: center.top
      };
      this.zoomHandlers.zoomToPoint(point, zoomRatio);
    }
  };

  tooltipHandlers = {
    show: async target => {
      if (target.tooltip && target.tooltip.enabled) {
        while (this.tooltipRef.hasChildNodes()) {
          this.tooltipRef.removeChild(this.tooltipRef.firstChild);
        }
        const tooltip = document.createElement('div');
        tooltip.className = 'rde-tooltip-right';
        let element = target.name;
        const { onTooltip } = this.props;
        if (onTooltip) {
          element = await onTooltip(this.tooltipRef, target);
          if (!element) {
            return;
          }
        }
        tooltip.innerHTML = element;
        this.tooltipRef.appendChild(tooltip);
        ReactDOM.render(element, tooltip);
        this.tooltipRef.classList.remove('tooltip-hidden');
        const zoom = this.canvas.getZoom();
        const { clientHeight } = this.tooltipRef;
        const { width, height, scaleX, scaleY } = target;
        const { left, top } = target.getBoundingRect();
        const { _offset: offset } = this.canvas.calcOffset();
        const objWidthDiff = width * scaleX * zoom;
        const objHeightDiff = (height * scaleY * zoom) / 2 - clientHeight / 2;
        const calcLeft = offset.left + left + objWidthDiff;
        const calcTop = offset.top + top + objHeightDiff;
        if (
          document.body.clientWidth <=
          calcLeft + this.tooltipRef.offsetWidth
        ) {
          this.tooltipRef.style.left = `${left +
            offset.left -
            this.tooltipRef.offsetWidth}px`;
          tooltip.className = 'rde-tooltip-left';
        } else {
          this.tooltipRef.style.left = `${calcLeft}px`;
        }
        this.tooltipRef.style.top = `${calcTop}px`;
        this.target = target;
      }
    },
    hide: target => {
      this.target = null;
      this.tooltipRef.classList.add('tooltip-hidden');
    }
  };

  contextmenuHandlers = {
    show: (e, target) => {
      const { onContext } = this.props;
      while (this.contextmenuRef.hasChildNodes()) {
        this.contextmenuRef.removeChild(this.contextmenuRef.firstChild);
      }
      const contextmenu = document.createElement('div');
      contextmenu.className = 'rde-contextmenu-right';
      const element = onContext(this.contextmenuRef, e, target);
      if (!element) {
        return;
      }
      contextmenu.innerHTML = element;
      this.contextmenuRef.appendChild(contextmenu);
      ReactDOM.render(element, contextmenu);
      this.contextmenuRef.classList.remove('contextmenu-hidden');
      const { clientX: left, clientY: top } = e;
      this.contextmenuRef.style.left = `${left - 50}px`;
      this.contextmenuRef.style.top = `${top - 25}px`;
    },
    hide: () => {
      this.contextmenuRef.classList.add('contextmenu-hidden');
    }
  };

  guidelineHandlers = {
    init: () => {
      this.ctx = this.canvas.getSelectionContext();
      this.aligningLineOffset = 5;
      this.aligningLineMargin = 4;
      this.aligningLineWidth = 1;
      this.aligningLineColor = 'rgb(255, 0, 0)';
      this.viewportTransform = this.canvas.viewportTransform;
      this.zoom = 1;
      this.verticalLines = [];
      this.horizontalLines = [];
    },
    drawVerticalLine: coords => {
      this.guidelineHandlers.drawLine(
        coords.x + 0.5,
        coords.y1 > coords.y2 ? coords.y2 : coords.y1,
        coords.x + 0.5,
        coords.y2 > coords.y1 ? coords.y2 : coords.y1
      );
    },
    drawHorizontalLine: coords => {
      this.guidelineHandlers.drawLine(
        coords.x1 > coords.x2 ? coords.x2 : coords.x1,
        coords.y + 0.5,
        coords.x2 > coords.x1 ? coords.x2 : coords.x1,
        coords.y + 0.5
      );
    },
    drawLine: (x1, y1, x2, y2) => {
      const {
        ctx,
        aligningLineWidth,
        aligningLineColor,
        viewportTransform,
        zoom
      } = this;
      ctx.save();
      ctx.lineWidth = aligningLineWidth;
      ctx.strokeStyle = aligningLineColor;
      ctx.beginPath();
      ctx.moveTo(
        x1 * zoom + viewportTransform[4],
        y1 * zoom + viewportTransform[5]
      );
      ctx.lineTo(
        x2 * zoom + viewportTransform[4],
        y2 * zoom + viewportTransform[5]
      );
      ctx.stroke();
      ctx.restore();
    },
    isInRange: (v1, v2) => {
      const { aligningLineMargin } = this;
      v1 = Math.round(v1);
      v2 = Math.round(v2);
      for (
        let i = v1 - aligningLineMargin, len = v1 + aligningLineMargin;
        i <= len;
        i++
      ) {
        if (i === v2) {
          return true;
        }
      }
      return false;
    },
    movingGuidelines: target => {
      const canvasObjects = this.canvas.getObjects();
      const activeObjectCenter = target.getCenterPoint();
      const activeObjectLeft = activeObjectCenter.x;
      const activeObjectTop = activeObjectCenter.y;
      const activeObjectBoundingRect = target.getBoundingRect();
      const activeObjectHeight =
        activeObjectBoundingRect.height / this.viewportTransform[3];
      const activeObjectWidth =
        activeObjectBoundingRect.width / this.viewportTransform[0];
      let horizontalInTheRange = false;
      let verticalInTheRange = false;
      const { _currentTransform: transform } = this.canvas;
      if (!transform) return;

      // It should be trivial to DRY this up by encapsulating (repeating) creation of x1, x2, y1, and y2 into functions,
      // but we're not doing it here for perf. reasons -- as this a function that's invoked on every mouse move

      for (let i = canvasObjects.length; i--; ) {
        if (
          canvasObjects[i] === target ||
          canvasObjects[i].superType === 'port' ||
          canvasObjects[i].superType === 'link' ||
          !canvasObjects[i].evented
        ) {
          continue;
        }

        const objectCenter = canvasObjects[i].getCenterPoint();
        const objectLeft = objectCenter.x;
        const objectTop = objectCenter.y;
        const objectBoundingRect = canvasObjects[i].getBoundingRect();
        const objectHeight =
          objectBoundingRect.height / this.viewportTransform[3];
        const objectWidth =
          objectBoundingRect.width / this.viewportTransform[0];

        // snap by the horizontal center line
        if (this.guidelineHandlers.isInRange(objectLeft, activeObjectLeft)) {
          verticalInTheRange = true;
          if (canvasObjects[i].id === 'workarea') {
            const y1 = -5000;
            const y2 = 5000;
            this.verticalLines.push({
              x: objectLeft,
              y1,
              y2
            });
          } else {
            this.verticalLines.push({
              x: objectLeft,
              y1:
                objectTop < activeObjectTop
                  ? objectTop - objectHeight / 2 - this.aligningLineOffset
                  : objectTop + objectHeight / 2 + this.aligningLineOffset,
              y2:
                activeObjectTop > objectTop
                  ? activeObjectTop +
                    activeObjectHeight / 2 +
                    this.aligningLineOffset
                  : activeObjectTop -
                    activeObjectHeight / 2 -
                    this.aligningLineOffset
            });
          }
          target.setPositionByOrigin(
            new fabric.Point(objectLeft, activeObjectTop),
            'center',
            'center'
          );
        }

        // snap by the left edge
        if (
          this.guidelineHandlers.isInRange(
            objectLeft - objectWidth / 2,
            activeObjectLeft - activeObjectWidth / 2
          )
        ) {
          verticalInTheRange = true;
          if (canvasObjects[i].id === 'workarea') {
            const y1 = -5000;
            const y2 = 5000;
            let x = objectLeft - objectWidth / 2;
            if (canvasObjects[i].layout === 'fullscreen') {
              x = 0;
            }
            this.verticalLines.push({
              x,
              y1,
              y2
            });
          } else {
            this.verticalLines.push({
              x: objectLeft - objectWidth / 2,
              y1:
                objectTop < activeObjectTop
                  ? objectTop - objectHeight / 2 - this.aligningLineOffset
                  : objectTop + objectHeight / 2 + this.aligningLineOffset,
              y2:
                activeObjectTop > objectTop
                  ? activeObjectTop +
                    activeObjectHeight / 2 +
                    this.aligningLineOffset
                  : activeObjectTop -
                    activeObjectHeight / 2 -
                    this.aligningLineOffset
            });
          }
          target.setPositionByOrigin(
            new fabric.Point(
              objectLeft - objectWidth / 2 + activeObjectWidth / 2,
              activeObjectTop
            ),
            'center',
            'center'
          );
        }

        // snap by the right edge
        if (
          this.guidelineHandlers.isInRange(
            objectLeft + objectWidth / 2,
            activeObjectLeft + activeObjectWidth / 2
          )
        ) {
          verticalInTheRange = true;
          if (canvasObjects[i].id === 'workarea') {
            const y1 = -5000;
            const y2 = 5000;
            let x = objectLeft + objectWidth / 2;
            if (canvasObjects[i].layout === 'fullscreen') {
              x = this.canvas.getWidth();
            }
            this.verticalLines.push({
              x,
              y1,
              y2
            });
          } else {
            this.verticalLines.push({
              x: objectLeft + objectWidth / 2,
              y1:
                objectTop < activeObjectTop
                  ? objectTop - objectHeight / 2 - this.aligningLineOffset
                  : objectTop + objectHeight / 2 + this.aligningLineOffset,
              y2:
                activeObjectTop > objectTop
                  ? activeObjectTop +
                    activeObjectHeight / 2 +
                    this.aligningLineOffset
                  : activeObjectTop -
                    activeObjectHeight / 2 -
                    this.aligningLineOffset
            });
          }
          target.setPositionByOrigin(
            new fabric.Point(
              objectLeft + objectWidth / 2 - activeObjectWidth / 2,
              activeObjectTop
            ),
            'center',
            'center'
          );
        }

        // snap by the vertical center line
        if (this.guidelineHandlers.isInRange(objectTop, activeObjectTop)) {
          horizontalInTheRange = true;
          if (canvasObjects[i].id === 'workarea') {
            const x1 = -5000;
            const x2 = 5000;
            this.horizontalLines.push({
              y: objectTop,
              x1,
              x2
            });
          } else {
            this.horizontalLines.push({
              y: objectTop,
              x1:
                objectLeft < activeObjectLeft
                  ? objectLeft - objectWidth / 2 - this.aligningLineOffset
                  : objectLeft + objectWidth / 2 + this.aligningLineOffset,
              x2:
                activeObjectLeft > objectLeft
                  ? activeObjectLeft +
                    activeObjectWidth / 2 +
                    this.aligningLineOffset
                  : activeObjectLeft -
                    activeObjectWidth / 2 -
                    this.aligningLineOffset
            });
          }
          target.setPositionByOrigin(
            new fabric.Point(activeObjectLeft, objectTop),
            'center',
            'center'
          );
        }

        // snap by the top edge
        if (
          this.guidelineHandlers.isInRange(
            objectTop - objectHeight / 2,
            activeObjectTop - activeObjectHeight / 2
          )
        ) {
          horizontalInTheRange = true;
          if (canvasObjects[i].id === 'workarea') {
            const x1 = -5000;
            const x2 = 5000;
            let y = objectTop - objectHeight / 2;
            if (canvasObjects[i].layout === 'fullscreen') {
              y = 0;
            }
            this.horizontalLines.push({
              y,
              x1,
              x2
            });
          } else {
            this.horizontalLines.push({
              y: objectTop - objectHeight / 2,
              x1:
                objectLeft < activeObjectLeft
                  ? objectLeft - objectWidth / 2 - this.aligningLineOffset
                  : objectLeft + objectWidth / 2 + this.aligningLineOffset,
              x2:
                activeObjectLeft > objectLeft
                  ? activeObjectLeft +
                    activeObjectWidth / 2 +
                    this.aligningLineOffset
                  : activeObjectLeft -
                    activeObjectWidth / 2 -
                    this.aligningLineOffset
            });
          }
          target.setPositionByOrigin(
            new fabric.Point(
              activeObjectLeft,
              objectTop - objectHeight / 2 + activeObjectHeight / 2
            ),
            'center',
            'center'
          );
        }

        // snap by the bottom edge
        if (
          this.guidelineHandlers.isInRange(
            objectTop + objectHeight / 2,
            activeObjectTop + activeObjectHeight / 2
          )
        ) {
          horizontalInTheRange = true;
          if (canvasObjects[i].id === 'workarea') {
            const x1 = -5000;
            const x2 = 5000;
            let y = objectTop + objectHeight / 2;
            if (canvasObjects[i].layout === 'fullscreen') {
              y = this.canvas.getHeight();
            }
            this.horizontalLines.push({
              y,
              x1,
              x2
            });
          } else {
            this.horizontalLines.push({
              y: objectTop + objectHeight / 2,
              x1:
                objectLeft < activeObjectLeft
                  ? objectLeft - objectWidth / 2 - this.aligningLineOffset
                  : objectLeft + objectWidth / 2 + this.aligningLineOffset,
              x2:
                activeObjectLeft > objectLeft
                  ? activeObjectLeft +
                    activeObjectWidth / 2 +
                    this.aligningLineOffset
                  : activeObjectLeft -
                    activeObjectWidth / 2 -
                    this.aligningLineOffset
            });
          }
          target.setPositionByOrigin(
            new fabric.Point(
              activeObjectLeft,
              objectTop + objectHeight / 2 - activeObjectHeight / 2
            ),
            'center',
            'center'
          );
        }
      }

      if (!horizontalInTheRange) {
        this.horizontalLines.length = 0;
      }

      if (!verticalInTheRange) {
        this.verticalLines.length = 0;
      }
    },
    scalingGuidelines: target => {
      // TODO...
    }
  };

  gridHandlers = {
    init: () => {
      const { gridOption } = this.props;
      if (gridOption.enabled && gridOption.grid) {
        const width = 5000;
        const gridLength = width / gridOption.grid;
        const lineOptions = {
          stroke: '#ebebeb',
          // strokeWidth: 1,
          selectable: false,
          evented: false,
          id: 'grid'
        };
        this.horizontalGridLines = [];
        this.verticalGridLines = [];
        for (let i = 0; i < gridLength; i++) {
          const distance = i * gridOption.grid;
          const fhorizontal = new fabric.Line(
            [distance, -width, distance, width],
            lineOptions
          );
          const shorizontal = new fabric.Line(
            [distance - width, -width, distance - width, width],
            lineOptions
          );
          this.canvas.add(fhorizontal);
          this.canvas.add(shorizontal);
          const fvertical = new fabric.Line(
            [-width, distance - width, width, distance - width],
            lineOptions
          );
          const svertical = new fabric.Line(
            [-width, distance, width, distance],
            lineOptions
          );
          this.canvas.add(fvertical);
          this.canvas.add(svertical);
          if (i % 5 === 0) {
            fhorizontal.set({ stroke: '#cccccc' });
            shorizontal.set({ stroke: '#cccccc' });
            fvertical.set({ stroke: '#cccccc', top: fvertical.top + 10 });
            svertical.set({ stroke: '#cccccc', top: svertical.top + 10 });
          } else {
            fvertical.set({ top: fvertical.top + 10 });
            svertical.set({ top: svertical.top + 10 });
          }
        }
      }
    },
    setCoords: target => {
      const {
        gridOption: { enabled, grid, snapToGrid }
      } = this.props;
      if (enabled && grid && snapToGrid) {
        target.set({
          left: Math.round(target.left / grid) * grid,
          top: Math.round(target.top / grid) * grid
        });
        target.setCoords();
        this.portHandlers.setCoords(target);
      }
    }
  };

  transactionHandlers = {
    init: () => {
      this.undos = [];
      this.redos = [];
    },
    undo: () => {
      const undo = this.undos.pop();
      if (undo) {
        this.redos.push(undo);
        if (undo.transaction === 'add') {
          const target = this.handlers.findById(undo.target.id);
          this.canvas.fxRemove(target);
          const { onRemove } = this.props;
          if (onRemove) {
            onRemove();
          }
        } else if (undo.transaction === 'modified') {
          const target = this.handlers.findById(undo.target.id);
          target.set(undo.target);
          target.setCoords();
          if (undo.target.type === 'image') {
            this.handlers.setImage(target, undo.target.src, false);
          }
          this.handlers.selectByObject(target);
        } else if (undo.transaction === 'remove') {
          this.handlers.add(undo.target, false, false, false);
        }
        this.canvas.renderAll();
      }
    },
    redo: () => {
      const redo = this.redos.pop();
      if (redo) {
        this.undos.push(redo);
        if (redo.transaction === 'add') {
          this.handlers.add(redo.target, false, false, false);
        } else if (redo.transaction === 'modified') {
          const target = this.handlers.findById(redo.target.id);
          target.set(redo.target);
          target.setCoords();
          if (redo.target.type === 'image') {
            this.handlers.setImage(target, redo.target.src, false);
          }
          this.handlers.selectByObject(target);
        } else if (redo.transaction === 'remove') {
          const target = this.handlers.findById(redo.target.id);
          this.canvas.remove(target);
          const { onRemove } = this.props;
          if (onRemove) {
            onRemove();
          }
        }
        this.canvas.renderAll();
      }
    },
    save: (target, transaction = 'add') => {
      if (!this.keyEvent.transaction) {
        return;
      }
      const newTarget = target.toObject(this.props.propertiesToInclude);
      this.undos.push({
        target: newTarget,
        transaction,
        date: new Date().valueOf()
      });
      if (transaction === 'add') {
        this.undos.push({
          target: newTarget,
          transaction: 'modified',
          date: new Date().valueOf()
        });
      }
    }
  };

  eventHandlers = {
    object: {
      mousedown: opt => {
        const { target } = opt;
        if (target && target.link && target.link.enabled) {
          const { onLink } = this.props;
          if (onLink) {
            onLink(this.canvas, target);
          }
        }
      }
    },
    modified: opt => {
      const { onModified } = this.props;
      const { target } = opt;
      if (onModified) {
        if (!target) {
          return;
        }
        if (target.type === 'circle' && target.parentId) {
          return;
        }
        onModified(target);
      }
    },
    moving: opt => {
      const { target } = opt;
      if (this.interactionMode === 'crop') {
        this.cropHandlers.moving(opt);
      } else {
        if (this.props.editable && this.props.guidelineOption.enabled) {
          this.guidelineHandlers.movingGuidelines(target);
        }
        if (target.superType === 'node') {
          this.portHandlers.setCoords(target);
          if (target.iconButton) {
            target.iconButton.set({
              left: target.left + 5,
              top: target.top + 5
            });
          }
        }
      }
    },
    moved: opt => {
      const { target } = opt;
      this.gridHandlers.setCoords(target);
    },
    scaling: opt => {
      if (this.interactionMode === 'crop') {
        this.cropHandlers.resize(opt);
      }
    },
    arrowmoving: e => {
      const activeObject = this.canvas.getActiveObject();
      if (!activeObject) {
        return false;
      }
      if (activeObject.id === 'workarea') {
        return false;
      }
      if (e.keyCode === 38) {
        activeObject.set('top', activeObject.top - 2);
        activeObject.setCoords();
        this.canvas.requestRenderAll();
      } else if (e.keyCode === 40) {
        activeObject.set('top', activeObject.top + 2);
        activeObject.setCoords();
        this.canvas.requestRenderAll();
      } else if (e.keyCode === 37) {
        activeObject.set('left', activeObject.left - 2);
        activeObject.setCoords();
        this.canvas.requestRenderAll();
      } else if (e.keyCode === 39) {
        activeObject.set('left', activeObject.left + 2);
        activeObject.setCoords();
        this.canvas.requestRenderAll();
      }
      this.transactionHandlers.save(activeObject, 'modified');
      if (this.props.onModified) {
        this.props.onModified(activeObject);
      }
    },
    mousewheel: opt => {
      const { zoomEnabled } = this.props;
      if (!zoomEnabled) {
        return;
      }
      const delta = opt.e.deltaY;
      let zoomRatio = this.canvas.getZoom();
      if (delta > 0) {
        zoomRatio -= 0.05;
      } else {
        zoomRatio += 0.05;
      }
      this.zoomHandlers.zoomToPoint(
        new fabric.Point(this.canvas.width / 2, this.canvas.height / 2),
        zoomRatio
      );
      opt.e.preventDefault();
      opt.e.stopPropagation();
    },
    mousedown: opt => {
      if (this.interactionMode === 'grab') {
        this.panning = true;
        return;
      }
      const { editable } = this.props;
      const { target } = opt;
      if (editable) {
        if (this.prevTarget && this.prevTarget.superType === 'link') {
          this.prevTarget.set({
            stroke: this.prevTarget.originStroke
          });
        }
        if (target && target.type === 'fromPort') {
          if (this.interactionMode === 'link' && this.activeLine) {
            return;
          }
          this.linkHandlers.init(target);
          return;
        }
        if (
          target &&
          this.interactionMode === 'link' &&
          (target.type === 'toPort' || target.superType === 'node')
        ) {
          let toPort;
          if (target.superType === 'node') {
            toPort = target.toPort;
          } else {
            toPort = target;
          }
          if (
            toPort.links.some(
              link => link.fromNode.id === this.activeLine.fromNode
            )
          ) {
            return;
          }
          return;
        }
        this.viewportTransform = this.canvas.viewportTransform;
        this.zoom = this.canvas.getZoom();
        if (this.interactionMode === 'selection') {
          if (target && target.superType === 'link') {
            target.set({
              stroke: target.selectedStroke || 'green'
            });
          }
          this.prevTarget = target;
          return;
        }
        if (this.interactionMode === 'polygon') {
          if (
            target &&
            this.pointArray.length &&
            target.id === this.pointArray[0].id
          ) {
            this.drawingHandlers.polygon.generate(this.pointArray);
          } else {
            this.drawingHandlers.polygon.addPoint(opt);
          }
        } else if (this.interactionMode === 'line') {
          if (this.pointArray.length && this.activeLine) {
            this.drawingHandlers.line.generate(opt);
          } else {
            this.drawingHandlers.line.addPoint(opt);
          }
        } else if (this.interactionMode === 'arrow') {
          if (this.pointArray.length && this.activeLine) {
            this.drawingHandlers.arrow.generate(opt);
          } else {
            this.drawingHandlers.arrow.addPoint(opt);
          }
        }
      }
    },
    mousemove: opt => {
      if (this.interactionMode === 'grab' && this.panning) {
        this.modeHandlers.moving(opt.e);
        this.canvas.requestRenderAll();
        return;
      }
      if (!this.props.editable && opt.target) {
        if (opt.target.id !== 'workarea') {
          if (opt.target !== this.target) {
            this.tooltipHandlers.show(opt.target);
          }
        } else {
          this.tooltipHandlers.hide(opt.target);
        }
      }
      if (this.interactionMode === 'polygon') {
        if (this.activeLine && this.activeLine.class === 'line') {
          const pointer = this.canvas.getPointer(opt.e);
          this.activeLine.set({ x2: pointer.x, y2: pointer.y });
          const points = this.activeShape.get('points');
          points[this.pointArray.length] = {
            x: pointer.x,
            y: pointer.y
          };
          this.activeShape.set({
            points
          });
          this.canvas.requestRenderAll();
        }
      } else if (this.interactionMode === 'line') {
        if (this.activeLine && this.activeLine.class === 'line') {
          const pointer = this.canvas.getPointer(opt.e);
          this.activeLine.set({ x2: pointer.x, y2: pointer.y });
        }
        this.canvas.requestRenderAll();
      } else if (this.interactionMode === 'arrow') {
        if (this.activeLine && this.activeLine.class === 'line') {
          const pointer = this.canvas.getPointer(opt.e);
          this.activeLine.set({ x2: pointer.x, y2: pointer.y });
        }
        this.canvas.requestRenderAll();
      } else if (this.interactionMode === 'link') {
        if (this.activeLine && this.activeLine.class === 'line') {
          const pointer = this.canvas.getPointer(opt.e);
          this.activeLine.set({ x2: pointer.x, y2: pointer.y });
        }
        this.canvas.requestRenderAll();
      }
    },
    mouseup: opt => {
      if (this.interactionMode === 'drawing') {
        this.drawingHandlers.pencil.finish();
      }
      if (this.interactionMode === 'grab') {
        this.panning = false;
        return;
      }
      if (this.props.editable && this.props.guidelineOption.enabled) {
        this.verticalLines.length = 0;
        this.horizontalLines.length = 0;
      }
      this.canvas.requestRenderAll();
    },
    mouseout: opt => {
      if (!opt.target) {
        this.contextmenuHandlers.hide();
        this.tooltipHandlers.hide();
      }
    },
    mouseleave: e => {
      this.contextmenuHandlers.hide();
    },
    selection: opt => {
      const { onSelect, activeSelection } = this.props;
      const { target } = opt;
      if (target && target.type === 'activeSelection') {
        target.set({
          ...activeSelection
        });
      }
      if (onSelect) {
        onSelect(target);
      }
    },
    beforeRender: opt => {
      this.canvas.clearContext(this.canvas.contextTop);
    },
    afterRender: opt => {
      for (let i = this.verticalLines.length; i--; ) {
        this.guidelineHandlers.drawVerticalLine(this.verticalLines[i]);
      }
      for (let i = this.horizontalLines.length; i--; ) {
        this.guidelineHandlers.drawHorizontalLine(this.horizontalLines[i]);
      }
      this.verticalLines.length = 0;
      this.horizontalLines.length = 0;
    },
    resize: (currentWidth, currentHeight, nextWidth, nextHeight) => {
      this.canvas.setWidth(nextWidth).setHeight(nextHeight);
      if (!this.workarea) {
        return;
      }
      const diffWidth = nextWidth / 2 - currentWidth / 2;
      const diffHeight = nextHeight / 2 - currentHeight / 2;
      if (this.workarea.layout === 'fixed') {
        this.canvas.centerObject(this.workarea);
        this.workarea.setCoords();
        this.canvas.getObjects().forEach((obj, index) => {
          if (index !== 0) {
            const left = obj.left + diffWidth;
            const top = obj.top + diffHeight;
            const el = this.elementHandlers.findById(obj.id);
            this.elementHandlers.setPosition(el, left, top);
            obj.set({
              left,
              top
            });
            obj.setCoords();
          }
        });
        this.canvas.requestRenderAll();
        return;
      }
      let scaleX = nextWidth / this.workarea.width;
      const scaleY = nextHeight / this.workarea.height;
      if (this.workarea.layout === 'responsive') {
        if (this.workarea.height > this.workarea.width) {
          scaleX = scaleY;
          if (nextWidth < this.workarea.width * scaleX) {
            scaleX = scaleX * (nextWidth / (this.workarea.width * scaleX));
          }
        } else {
          if (nextHeight < this.workarea.height * scaleX) {
            scaleX = scaleX * (nextHeight / (this.workarea.height * scaleX));
          }
        }
        const deltaPoint = new fabric.Point(diffWidth, diffHeight);
        this.canvas.relativePan(deltaPoint);
        const center = this.canvas.getCenter();
        const point = {
          x: center.left,
          y: center.top
        };
        this.zoomHandlers.zoomToPoint(point, scaleX);
        this.canvas.requestRenderAll();
        return;
      }
      const diffScaleX =
        nextWidth / (this.workarea.width * this.workarea.scaleX);
      const diffScaleY =
        nextHeight / (this.workarea.height * this.workarea.scaleY);
      this.workarea.set({
        scaleX,
        scaleY
      });
      this.canvas.getObjects().forEach(obj => {
        if (obj.id !== 'workarea') {
          const left = obj.left * diffScaleX;
          const top = obj.top * diffScaleY;
          const width = obj.width * scaleX;
          const height = obj.height * scaleY;
          const el = this.elementHandlers.findById(obj.id);
          this.elementHandlers.setSize(el, width, height);
          if (obj.player) {
            obj.player.setPlayerSize(width, height);
          }
          this.elementHandlers.setPosition(el, left, top);
          const newScaleX = obj.scaleX * diffScaleX;
          const newScaleY = obj.scaleY * diffScaleY;
          obj.set({
            scaleX: newScaleX,
            scaleY: newScaleY,
            left,
            top
          });
          obj.setCoords();
        }
      });
      this.canvas.requestRenderAll();
    },
    paste: e => {
      if (this.canvas.wrapperEl !== document.activeElement) {
        return false;
      }
      e = e || window.event;
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      const clipboardData = e.clipboardData || window.clipboardData;
      if (clipboardData.types.length) {
        clipboardData.types.forEach(clipboardType => {
          if (clipboardType === 'text/plain') {
            const textPlain = clipboardData.getData('text/plain');
            const item = {
              id: uuid(),
              type: 'textbox',
              text: textPlain
            };
            this.handlers.add(item, true);
          } else if (clipboardType === 'text/html') {
            // Todo ...
            // const textHtml = clipboardData.getData('text/html');
          } else if (clipboardType === 'Files') {
            Array.from(clipboardData.files).forEach(file => {
              const { type } = file;
              if (
                type === 'image/png' ||
                type === 'image/jpeg' ||
                type === 'image/jpg'
              ) {
                const item = {
                  id: uuid(),
                  type: 'image',
                  file
                };
                this.handlers.add(item, true);
              } else {
                console.error('Not supported file type');
              }
            });
          }
        });
      }
    },
    keydown: e => {
      if (this.canvas.wrapperEl !== document.activeElement) {
        return false;
      }
      const { keyEvent } = this;
      if (!Object.keys(keyEvent).length) {
        return false;
      }
      const { move, all, copy, paste, esc, del, transaction } = keyEvent;
      if (e.keyCode === 87) {
        this.keyCode = e.keyCode;
      } else if (e.keyCode === 81) {
        this.keyCode = e.keyCode;
      }
      if (e.ctrlKey) {
        this.canvas.defaultCursor = 'grab';
        this.workarea.hoverCursor = 'grab';
      }
      if (e.keyCode === 46 && del) {
        this.handlers.remove();
      } else if (e.code.includes('Arrow') && move) {
        this.eventHandlers.arrowmoving(e);
      } else if (e.ctrlKey && e.keyCode === 65 && all) {
        e.preventDefault();
        this.handlers.allSelect();
      } else if (e.ctrlKey && e.keyCode === 67 && copy) {
        e.preventDefault();
        this.handlers.copy();
      } else if (e.ctrlKey && e.keyCode === 86 && paste) {
        e.preventDefault();
        this.handlers.paste();
      } else if (e.ctrlKey && e.keyCode === 89 && transaction) {
        e.preventDefault();
        this.transactionHandlers.redo();
      } else if (e.ctrlKey && e.keyCode === 90 && transaction) {
        e.preventDefault();
        this.transactionHandlers.undo();
      } else if (e.keyCode === 27 && esc) {
        if (this.interactionMode === 'selection') {
          this.canvas.discardActiveObject();
          this.canvas.renderAll();
        } else if (this.interactionMode === 'polygon') {
          this.drawingHandlers.polygon.finish();
        } else if (this.interactionMode === 'line') {
          this.drawingHandlers.line.finish();
        } else if (this.interactionMode === 'arrow') {
          this.drawingHandlers.arrow.finish();
        } else if (this.interactionMode === 'link') {
          this.linkHandlers.finish();
        }
      }
    },
    keyup: e => {
      if (this.keyCode !== 87) {
        this.canvas.defaultCursor = 'default';
        this.workarea.hoverCursor = 'default';
        this.modeHandlers.selection();
      }
    },
    contextmenu: e => {
      e.preventDefault();
      const { editable, onContext } = this.props;
      if (editable && onContext) {
        const target = this.canvas.findTarget(e);
        if (target && target.type !== 'activeSelection') {
          this.handlers.select(target);
        }
        this.contextmenuHandlers.show(e, target);
      }
    },
    onmousedown: e => {
      if (e.target.localName !== 'canvas') {
        return;
      }
      this.contextmenuHandlers.hide();
    }
  };

  render() {
    const { id } = this.state;
    return (
      <div ref={this.container} id="rde-canvas" className="rde-canvas">
        <canvas id={`canvas_${id}`} className="rde-editor-workarea" />
      </div>
    );
  }
}

export default Canvas;
