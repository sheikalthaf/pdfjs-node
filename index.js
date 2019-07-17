const PDFJS = require('pdfjs-dist');
const { createCanvas } = require('canvas');
var domino = require('domino');
var Element = domino.impl.Element; // etc

var window = domino.createWindow('<div id="viewer"></div>');

let PAGE_HEIGHT;
const DEFAULT_SCALE = 1.33;

// or even
// const { document } = window;
global.document = window.document;

(async function() {
  try {
    // PDFJS.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.js';
    const pdf = await PDFJS.getDocument('./angularjs_tutorial.pdf').promise;
    let pdfDocument = pdf;
    console.log(pdf.numPages);

    let viewer = document.getElementById('viewer');
    // console.log(viewer);
    for (let i = 0; i < pdf.numPages; i++) {
      // console.log('view append');
      let page = createEmptyPage(i + 1);
      viewer.appendChild(page);
    }

    const pdfPage = await loadPage(1);
    let viewport = pdfPage.getViewport({ scale: DEFAULT_SCALE });
    PAGE_HEIGHT = viewport.height;
    document.body.style.width = `${viewport.width}px`;

    // window.addEventListener('scroll', handleWindowScroll);

    function createEmptyPage(num) {
      let page = document.createElement('div');
      const canvas = document.createElement('canvas');
      let wrapper = document.createElement('div');
      let textLayer = document.createElement('div');

      page.className = 'page';
      wrapper.className = 'canvasWrapper';
      textLayer.className = 'textLayer';

      page.setAttribute('id', `pageContainer${num}`);
      page.setAttribute('data-loaded', 'false');
      page.setAttribute('data-page-number', num);

      canvas.setAttribute('id', `page${num}`);

      page.appendChild(wrapper);
      page.appendChild(textLayer);
      wrapper.appendChild(canvas);

      return page;
    }

    async function loadPage(pageNum) {
      const pdfPage = await pdfDocument.getPage(pageNum);
      let page = document.getElementById(`pageContainer${pageNum}`);
      let wrapper = page.querySelector('.canvasWrapper');
      let container = page.querySelector('.textLayer');
      let viewport = pdfPage.getViewport({ scale: DEFAULT_SCALE });

      const canvas = createCanvas(viewport.width * 2, viewport.height * 2);
      let canvasContext = canvas.getContext('2d');

      page.style.width = `${viewport.width}px`;
      page.style.height = `${viewport.height}px`;
      wrapper.style.width = `${viewport.width}px`;
      wrapper.style.height = `${viewport.height}px`;
      container.style.width = `${viewport.width}px`;
      container.style.height = `${viewport.height}px`;

      // console.log(canvasContext);

      pdfPage.render({
        canvasContext,
        viewport
      });

      // const textContent = pdfPage.getTextContent();
      // PDFJS.renderTextLayer({
      //   textContent,
      //   container,
      //   viewport,
      //   textDivs: []
      // });

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
  } catch (err) {
    console.log(err);
  }
})();
