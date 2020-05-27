import {DEFAULT_LOADER_OPTIONS} from '../constants';
import {NullLog} from './loggers';

const isPureObject = value =>
  value && typeof value === 'object' && value.constructor === {}.constructor;

let globalOptions = {...DEFAULT_LOADER_OPTIONS};

// Set global loader options
export function setGlobalOptions(options) {
  globalOptions = mergeOptions(globalOptions, options);
}

// Merges options with global opts and loader defaults, also injects baseUri
export function mergeOptions(loader, options) {
  const loaderDefaultOptions =
    loader && (loader.DEFAULT_LOADER_OPTIONS || loader.defaultOptions || loader.options || {});

  const mergedOptions = {...loaderDefaultOptions};

  // LOGGING: options.log can be set to `null` to defeat logging
  if (mergedOptions.log === null) {
    mergedOptions.log = new NullLog();
  }

  mergeNestedFields(mergedOptions, globalOptions);
  mergeNestedFields(mergedOptions, options);

  return mergedOptions;
}

// Merge nested options objects
function mergeNestedFields(mergedOptions, options) {
  for (const key in options) {
    // Check for nested options
    // object in options => either no key in defaultOptions or object in defaultOptions
    if (key in options) {
      const value = options[key];
      if (isPureObject(value) && isPureObject(mergedOptions[key])) {
        mergedOptions[key] = {
          ...mergedOptions[key],
          ...options[key]
        };
      } else {
        mergedOptions[key] = options[key];
      }
    }
    // else: No need to merge nested opts, and the initial merge already copied over the nested options
  }
}
