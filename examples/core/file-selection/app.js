/* eslint-disable */
import {loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {JSONLoader} from '@loaders.gl/json';
import {ArrowLoader} from '@loaders.gl/arrow';

// wait for window to load
window.addEventListener('load', () => {
  const loadButton = document.createElement('input');
  loadButton.setAttribute('value', 'Load File');
  document.body.appendChild(loadButton);

  // Note: Dialogs are only shown in response to actual user clicks
  loadButton.addEventListener('click', () =>
    openFileDialog('.txt,text/plain', true, fileDialogChanged)
  );
});

// open a dialog function
function openFileDialog(accept, multiple = false, callback) {
  const fileDialogElement = document.createElement('input');
  fileDialogElement.type = 'file';
  if ('accept' in fileDialogElement) {
    // Note Edge does not support this attribute
    fileDialogElement.accept = accept;
  }
  if (multiple) {
    fileDialogElement.multiple = multiple;
  }

  if (typeof callback === 'function') {
    fileDialogElement.addEventListener('change', callback);
  }

  fileDialogElement.dispatchEvent(new MouseEvent('click'));
}

// file dialog onchange event handler
async function fileDialogChanged(event) {
  for (const file of this.files) {
    const asyncIterator = await loadInBatches(file, [CSVLoader, JSONLoader, ArrowLoader]);
    console.log(asyncIterator);

    // var div = document.createElement('div');
    // div.className = 'fileList common';
    // div.textContent = file.name;
    // userSelectedFiles.appendChild(div);
  }
}
