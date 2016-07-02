import {input, div, button, p} from '@cycle/dom';
import {Observable} from 'rx';
import tinycolor from 'tinycolor2';

import {containerBoundaries} from './helpers';

function updateSaturation (event) {
  return state => {
    if (!state.saturationIsDragging) { return state; }

    const {
      isInBounds,
      containerLeft,
      containerTop,
      containerWidth,
      containerHeight,
      top,
      left
    } = containerBoundaries(state, event, 'saturation');

    if (isInBounds) {
      const saturation = left * 100 / containerWidth;
      const bright = -(top * 100 / containerHeight) + 100;
      const computed = tinycolor({h: state.color.h, s: saturation, v: bright }).toHsl();

      return Object.assign(
        {},
        state,
        {color: computed}
      );
    }

    return state;
  };
}

function between (min, max, value) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function updateSaturationIndicatorPosition (event) {
  return state => {
    if (!state.saturationIsDragging) { return state; }

    const left = event.clientX;
    const top = event.clientY;

    const {
      containerWidth,
      containerHeight,
      containerTop,
      containerLeft
    } = containerBoundaries(state, event, 'saturation');

    const saturationIndicatorPosition = {
      left: between(0, containerWidth + containerLeft, left) - containerLeft,
      top: between(0, containerHeight + containerTop, top) - containerTop
    };

    return Object.assign(state, {}, {saturationIsDragging: true, saturationIndicatorPosition});
  };
}

function updateHueIndicatorPosition (event) {
  return state => {
    if (!state.hueIsDragging) { return state; }

    const left = event.clientX;

    const {
      containerWidth,
      containerLeft
    } = containerBoundaries(state, event, 'hue');

    const hueIndicatorPosition = {
      left: between(0, containerWidth + containerLeft, left) - containerLeft
    };

    return Object.assign(state, {}, {hueIsDragging: true, hueIndicatorPosition});
  };
}

function updateHue (event) {
  return state => {
    if (!state.hueIsDragging) { return state; }
    const {
      containerWidth,
      containerLeft,
      left
    } = containerBoundaries(state, event, 'hue');

    if (left > 0 && left < containerWidth) {
      const percent = left * 100 / containerWidth;
      const h = (360 * percent / 100);
      const color = Object.assign(state.color, {}, {h});

      return Object.assign(state, {}, {color});
    }

    return state;
  };
}

function updateAlphaIndicatorPosition (event) {
  return state => {
    if (!state.alphaIsDragging) { return state; }

    const left = event.clientX;

    const {
      containerWidth,
      containerLeft
    } = containerBoundaries(state, event, 'alpha');

    const alphaIndicatorPosition = {
      left: between(0, containerWidth + containerLeft, left) - containerLeft
    };

    return Object.assign(state, {}, {alphaIsDragging: true, alphaIndicatorPosition});
  };
}

function updateAlpha (event) {
  return state => {
    if (!state.alphaIsDragging) { return state; }

    const {
      containerWidth,
      left
    } = containerBoundaries(state, event, 'alpha');

    const a = (between(0, containerWidth, left) * 100 / containerWidth) / 100;
    const color = Object.assign(
      {},
      state.color,
      {a}
    );

    return Object.assign({}, state, {color});
  };
}

function view (state) {
  const saturationBackground = `hsl(${state.color.h}, 100%, 50%)`;
  const saturationIndicatorColor = tinycolor.mix('#fff', '#000', parseFloat(state.color.l)).toHexString();

  const saturationIndicatorStyle = {
    left: `${state.saturationIndicatorPosition.left}px`,
    top: `${state.saturationIndicatorPosition.top}px`,
    'border-color': saturationIndicatorColor
  };

  const hueIndicatorStyle = {
    left: `${state.hueIndicatorPosition.left}px`
  };

  const alphaIndicatorStyle = {
    left: `${state.alphaIndicatorPosition.left}px`
  };

  const swatchBackground = tinycolor(state.color).setAlpha(state.color.a);
  const swatchStyle = {background: tinycolor(swatchBackground).toRgbString()};

  console.log(state.color.a);
  const gradientStart = tinycolor(state.color).setAlpha(0);
  const gradientStyle = {background: `linear-gradient(to right, ${tinycolor(gradientStart).toRgbString()}  0%, ${tinycolor(tinycolor(state.color).toHexString()).toRgbString()} 100%)`};

  return div('.container', [
    div('.color-picker', [
      div('.saturation', [
        div('.color-overlay'),
        div('.color', {style: {background: saturationBackground}}),
        div('.black'),
        div('.indicator', {style: saturationIndicatorStyle})
      ]),
      div('.hue-container', [
        div('.hue', [
          div('.hue-indicator', {style: hueIndicatorStyle})
        ])
      ]),
      div('.alpha-container', [
        div('.alpha', [
          div('.checkerboard'),
          div('.gradient-overlay', {style: gradientStyle}),
          div('.alpha-indicator', {style: alphaIndicatorStyle})
        ])
      ])
    ]),
    div('.swatch', {style: swatchStyle})
  ]);
}

export default function App ({DOM, Mouse}) {
  const mouseUp$ = Mouse.up()
    .map(ev => state => Object.assign({}, state, {
      saturationIsDragging: false,
      hueIsDragging: false,
      alphaIsDragging: false
    }));

  const saturation = DOM
    .select('.saturation');

  const saturationMouseDown$ = saturation
    .events('mousedown')
    .map(ev => state => Object.assign({}, state, {saturationIsDragging: true}));

  const saturationMouseMove$ = saturation
    .events('mousemove');

  const updateSaturation$ = saturationMouseMove$
    .map(ev => updateSaturation(event));

  const updateSaturationIndicatorPosition$ = saturationMouseMove$
    .map(ev => updateSaturationIndicatorPosition(ev));

  const saturationContainerDimensions$ = saturation
    .observable
    .map(el => el[0].getBoundingClientRect())
    .map(value => state => Object.assign({}, state, {saturationContainer: value}))
    .take(1);

  const hue = DOM
    .select('.hue');

  const hueMouseDown$ = hue
    .events('mousedown')
    .map(ev => state => Object.assign({}, state, {hueIsDragging: true}));

  const hueMouseMove$ = hue
    .events('mousemove');

  const updateHue$ = hueMouseMove$
    .map(ev => updateHue(ev));

  const updateHueIndicatorPosition$ = hueMouseMove$
    .map(ev => updateHueIndicatorPosition(ev));

  const hueContainer$ = hue
    .observable
    .map(el => el[0].getBoundingClientRect())
    .map(value => state => Object.assign({}, state, {hueContainer: value}))
    .take(1);

  const alpha = DOM
    .select('.alpha');

  const alphaMouseDown$ = alpha
    .events('mousedown')
    .map(ev => state => Object.assign({}, state, {alphaIsDragging: true}));

  const alphaMouseMove$ = alpha
    .events('mousemove');

  const updateAlpha$ = alphaMouseMove$
    .map(ev => updateAlpha(ev));

  const updateAlphaIndicatorPosition$ = alphaMouseMove$
    .map(ev => updateAlphaIndicatorPosition(ev));

  const alphaContainer$ = alpha
    .observable
    .map(el => el[0].getBoundingClientRect())
    .map(value => state => Object.assign({}, state, {alphaContainer: value}))
    .take(1);

  const initialState = {
    saturationContainer: null,
    saturationIsDragging: false,
    saturationIndicatorPosition: {
      left: 0,
      top: 0
    },
    hueContainer: null,
    hueIsDragging: false,
    hueIndicatorPosition: {
      left: 0,
      top: 0
    },
    alphaContainer: null,
    alphaIsDragging: false,
    alphaIndicatorPosition: {
      top: 0,
      left: 0
    }
    ,
    color: tinycolor('white').toHsl()
 };

  const action$ = Observable.merge(
    mouseUp$,
    saturationMouseDown$,
    updateSaturation$,
    updateSaturationIndicatorPosition$,
    saturationContainerDimensions$,
    hueMouseDown$,
    updateHue$,
    updateHueIndicatorPosition$,
    hueContainer$,
    alphaMouseDown$,
    updateAlpha$,
    alphaContainer$,
    updateAlphaIndicatorPosition$
  );

  const state$ = action$
    .startWith(initialState)
    .scan((state, action) => action(state));

  return {
    DOM: state$.map(view)
  };
}
