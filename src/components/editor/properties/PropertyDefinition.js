import MarkerProperty from './MarkerProperty';
import GeneralProperty from './GeneralProperty';
import StyleProperty from './StyleProperty';
import ImageProperty from './ImageProperty';
import TextProperty from './TextProperty';
import MapProperty from './MapProperty';
import ShadowProperty from './ShadowProperty';

export default {
  map: {
    map: {
      title: 'canvas-props',
      component: MapProperty
    }
    // image: {
    //   title: 'image-props',
    //   component: ImageProperty,
    // }
  },
  group: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  path: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  'i-text': {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    marker: {
      title: 'icon',
      component: MarkerProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  textbox: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    text: {
      title: 'text',
      component: TextProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  image: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    image: {
      title: 'image',
      component: ImageProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  triangle: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  rect: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  circle: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  polygon: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  line: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  },
  arrow: {
    general: {
      title: 'general',
      component: GeneralProperty
    },
    style: {
      title: 'style',
      component: StyleProperty
    },
    shadow: {
      title: 'shadow',
      component: ShadowProperty
    }
  }
};
