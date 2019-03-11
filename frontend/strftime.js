/******************************************************************************
 * strftime - Ruby-style strftime in JavaScript
 * (c) ArtOfCode 2019-*
 * MIT License
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function () {
  'use strict';

  Date.prototype.strftime = function (format) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const mappers = {
      'S': () => this.getSeconds().toString().padStart(2, '0'),
      'L': () => this.getMilliseconds().toString().padStart(3, '0'),
      's': () => Math.floor(this.getTime() / 1000),

      'M': () => this.getMinutes().toString().padStart(2, '0'),

      'H': () => this.getHours().toString().padStart(2, '0'),
      'I': () => (this.getHours() % 12).toString().padStart(2, '0'),
      'k': () => this.getHours().toString().padStart(2, ' '),
      'l': () => (this.getHours() % 12).toString().padStart(2, ' '),

      'a': () => days[this.getDay()].substr(0, 3),
      'A': () => days[this.getDay()],
      'd': () => this.getDate().toString().padStart(2, '0'),
      'e': () => this.getDate(),

      'b': () => months[this.getMonth()].substr(0, 3),
      'B': () => months[this.getMonth()],
      'm': () => (this.getMonth() + 1).toString().padStart(2, '0'),

      'y': () => this.getFullYear().toString().substr(2, 2),
      'Y': () => this.getFullYear(),

      'p': () => this.getHours() < 12 ? 'am' : 'pm',
      'P': () => this.getHours() < 12 ? 'AM' : 'PM',

      '%': () => '%'
    };

    const chars = format.split('');
    let formatted = '';
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === '%') {
        i += 1;
        const control = chars[i];
        if (!!mappers[control]) {
          formatted += mappers[control].call(this);
        }
        else {
          formatted += `%${control}`;
        }
      }
      else {
        formatted += chars[i];
      }
    }
    return formatted;
  };
})();