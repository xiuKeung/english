// Material after Unit 6. PDF page 49 and later are intentionally grouped here.
(function () {
  const firstPdfPage = 49;
  const pages = Array.from({ length: 12 }, (_, index) => {
    const pdfPage = firstPdfPage + index;
    return {
      label: `其他 · PDF 第 ${pdfPage} 页`,
      image: `./resources/pages/other-page-${pdfPage + 1}.png`,
      hotspots: []
    };
  });
  window.ENGLISH_OTHER = {
    id: "other",
    title: "其他内容",
    englishTitle: "More English activities",
    sourcePages: Array.from({ length: 12 }, (_, index) => firstPdfPage + index),
    words: [],
    sentences: [],
    pages
  };
})();
