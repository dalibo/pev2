import * as _ from 'lodash';
import hljs from 'highlight.js/lib/highlight';
import 'highlight.js/styles/default.css';
import pgsql from 'highlight.js/lib/languages/pgsql';
hljs.registerLanguage('pgsql', pgsql);

export class SyntaxHighlightService {
  private OPEN_TAG: string = ' _OPEN_TAG_';
  private CLOSE_TAG: string = '_CLOSE_TAG_';

  public highlight(code: string, keyItems: string[]) {
    hljs.configure({
      tabReplace: '    ',
    });

    // prior to syntax highlighting, we want to tag key items in the raw code. making the
    // query upper case and ensuring that all comma separated values have a space
    // makes it simpler to find the items we're looing for
    let result: string = code.toUpperCase().replace(/,(?!$)\s{1,}/gm, ', ');
    _.each(keyItems, (keyItem: string) => {
      result = result.replace(keyItem.toUpperCase(), `${this.OPEN_TAG}${keyItem}${this.CLOSE_TAG}`);
    });

    result = hljs.highlightAuto(result, ['pgsql']).value;
    result = result.replace(new RegExp(this.OPEN_TAG, 'g'), `<span class='code-key-item'>`);
    result = result.replace(new RegExp(this.CLOSE_TAG, 'g'), '</span>');

    return result;
  }
}
