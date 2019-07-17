let pdfDocument;
let PAGE_HEIGHT;
const DEFAULT_SCALE = 1.33;

var Canvas = require('canvas');
var assert = require('assert');
var fs = require('fs');
var domino = require('domino');
var wind = domino.createWindow('<div id="viewer"></div>');
var document = wind.document;

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, 'Invalid canvas size');
    var canvas = Canvas.createCanvas(width, height);
    var context = canvas.getContext('2d');
    return {
      canvas: canvas,
      context: context
    };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');
    assert(width > 0 && height > 0, 'Invalid canvas size');
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
};

// HACK few hacks to let PDF.js be loaded not as a module in global space.
require('./domstubs.js').setStubs(global);
const PDFJS = require('pdfjs-dist');

(async function() {
  PDFJS.workerSrc = './pdf.worker.js';
  const pdf = await PDFJS.getDocument('./angularjs_tutorial.pdf').promise;
  pdfDocument = pdf;

  let viewer = wind.document.getElementById('viewer');
  // console.log(viewer);
  for (let i = 0; i < pdf.numPages; i++) {
    var { page, wrapper, textLayer } = createEmptyPage(i + 1);
    viewer.appendChild(page);
  }

  const pdfPage = await loadPage(2, page, wrapper, textLayer);
  let viewport = pdfPage.getViewport({ scale: DEFAULT_SCALE });
  PAGE_HEIGHT = viewport.height;
  console.log(viewer.innerHTML);
  // document.body.style.width = `${viewport.width}px`;
})();
// window.addEventListener('scroll', handleWindowScroll);

function createEmptyPage(num) {
  let page = document.createElement('div');
  // let canvas = document.createElement('canvas');
  let wrapper = document.createElement('div');
  let textLayer = document.createElement('div');

  page.className = 'page';
  wrapper.className = 'canvasWrapper';
  textLayer.className = 'textLayer';

  page.setAttribute('id', `pageContainer${num}`);
  page.setAttribute('data-loaded', 'false');
  page.setAttribute('data-page-number', num);

  // canvas.setAttribute('id', `page${num}`);

  page.appendChild(wrapper);
  page.appendChild(textLayer);
  // wrapper.appendChild(canvas);
  // console.log(page);
  return { page, wrapper, textLayer };
}

async function loadPage(pageNum, page, wrapper, container) {
  const pdfPage = await pdfDocument.getPage(pageNum);
  // let page = document.getElementById(`pageContainer${pageNum}`);
  // let canvas = page.querySelector('canvas');
  // let wrapper = page.querySelector('.canvasWrapper');
  // let container = page.querySelector('.textLayer');
  // let canvasContext = canvas.getContext('2d');
  let viewport = pdfPage.getViewport({ scale: DEFAULT_SCALE });
  var canvasFactory = new NodeCanvasFactory();
  var canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

  // canvas.width = viewport.width * 2;
  // canvas.height = viewport.height * 2;
  // page.style.width = `${viewport.width}px`;
  // page.style.height = `${viewport.height}px`;
  // wrapper.style.width = `${viewport.width}px`;
  // wrapper.style.height = `${viewport.height}px`;
  // container.style.width = `${viewport.width}px`;
  // container.style.height = `${viewport.height}px`;

  var renderContext = {
    canvasContext: canvasAndContext.context,
    viewport: viewport,
    canvasFactory: canvasFactory
  };

  var renderTask = pdfPage.render(renderContext);
  // renderTask.promise.then(function() {
  //   // Convert the canvas to an image buffer.
  //   var image = canvasAndContext.canvas.toBuffer();
  //   fs.writeFile('output.png', image, function(error) {
  //     if (error) {
  //       console.error('Error: ' + error);
  //     } else {
  //       console.log(
  //         'Finished converting first page of PDF file to a PNG image.'
  //       );
  //     }
  //   });
  // });

  const textContent = await pdfPage.getTextContent();
  PDFJS.renderTextLayer({
    textContent,
    container,
    viewport,
    textDivs: [],
    Canvas,
    doc: wind.document
  });

  page.setAttribute('data-loaded', 'true');

  return pdfPage;
}

// function handleWindowScroll() {
//   let visiblePageNum = Math.round(window.scrollY / PAGE_HEIGHT) + 1;
//   let visiblePage = document.querySelector(
//     `.page[data-page-number="${visiblePageNum}"][data-loaded="false"]`
//   );
//   if (visiblePage) {
//     setTimeout(function() {
//       loadPage(visiblePageNum);
//     });
//   }
// }
