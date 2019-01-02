(function(global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory;
  }
  else if (typeof define === 'function' && define.amd) {
    define('JZZ.gui.Karaoke', ['JZZ', 'JZZ.midi.SMF'], factory);
  }
  else {
    factory(JZZ);
  }
})(this, function(JZZ) {

  if (!JZZ.gui) JZZ.gui = {};
  if (JZZ.gui.Karaoke) return;

  var _gui;

  function Karaoke(at) {
    var self = new JZZ.Widget();
    for (var k in Karaoke.prototype) if (Karaoke.prototype.hasOwnProperty(k)) self[k] = Karaoke.prototype[k];
    self.tracks = [];
    try {
      self.gui = document.createElement('div');
      _gui = true;
    }
    catch (e) {
      return self; // not in browser
    }
    self.gui.className = 'karaoke';
    if (typeof at == 'string') {
      try {
        document.getElementById(at).appendChild(self.gui);
        return self;
      }
      catch(e) {}
    }
    try {
      at.appendChild(self.gui);
      return self;
    }
    catch(e) {}
    document.body.appendChild(self.gui);
    return self;
  }
  Karaoke.prototype.load = function(smf) {
    var i, j, msg, txt, cl, tt;
    var track, verse, line, div, span;
    if (this.gui) while (this.gui.firstChild) {
      this.gui.removeChild(this.gui.firstChild);
    }
    this.tracks = [];
    for (i = 0; i < smf.length; i++) {
      if (smf[i] instanceof JZZ.MIDI.SMF.MTrk) {
        track = undefined;
        for (j = 0; j < smf[i].length; j++) {
          if (smf[i][j].ff == 1) {
            tt = smf[i][j].tt;
            if (!track) {
              track = new Track();
              if (this.gui) {
                track.dom = document.createElement('div');
                this.gui.appendChild(track.dom);
              }
              this.tracks.push(track);
              verse = undefined;
            }
            txt = JZZ.lib.fromUTF8(smf[i][j].dd);
            if (txt[0] == '@') {
              cl = { K: 'k', V: 'v', I: 'i', L: 'l', T: 't', W: 'w' }[txt[1]];
              if (cl) txt = txt.substring(2);
              if (this.gui) {
                div = document.createElement('div');
                if (cl) div.className = cl;
                div.appendChild(document.createTextNode(txt));
                track.dom.appendChild(div);
              }
              if (cl == 't') track.title = track.title ? track.title + '\n' + txt : txt;
              verse = undefined;
              continue;
            }
            if (txt[0] == '\\') {
              txt = txt.substring(1);
              verse = undefined;
            }
            else if (txt[0] == '/') {
              txt = txt.substring(1);
              line = undefined;
            }
            if (!verse) {
              verse = { tt: tt, lines: [] };
              if (this.gui) {
                verse.dom = document.createElement('p');
                track.dom.appendChild(verse.dom);
              }
              track.verses.push(verse);
              line = undefined;
            }
            if (!line) {
              line = { tt: tt, spans: [] };
              if (this.gui) {
                line.dom = document.createElement('div');
                verse.dom.appendChild(line.dom);
              }
              verse.lines.push(line);
            }
            span = { tt: tt, txt: txt };
            if (this.gui) {
              span.dom = document.createElement('span');
              span.dom.appendChild(document.createTextNode(txt));
              line.dom.appendChild(span.dom);
            }
            line.spans.push(span);
          }
        }
      }
    }
  };
  Karaoke.prototype.reset = function() {
    for (var i = 0; i < this.tracks.length; i++) this.tracks[i].reset();
  };
  Karaoke.prototype._receive = function(msg) {
    if (typeof msg.tt != 'undefined') {
      for (var i = 0; i < this.tracks.length; i++) this.tracks[i].update(msg.tt);
    }
  };
  Karaoke.prototype.toString = function() {
    var a = [];
    for (var i = 0; i < this.tracks.length; i++) {
      var track = this.tracks[i];
      if (this.tracks[i].title) {
        if (a.length) a.push('');
        a.push(this.tracks[i].title);
      }
      for (var j = 0; j < this.tracks[i].verses.length; j++) {
        if (a.length) a.push('');
        for (var k = 0; k < this.tracks[i].verses[j].lines.length; k++) {
          var s = '';
          for (var n = 0; n < this.tracks[i].verses[j].lines[k].spans.length; n++) {
            s += this.tracks[i].verses[j].lines[k].spans[n].txt;
          }
          a.push(s);
        }
      }
    }
    return a.join('\n');
  };

  function Track() {
    this.verses = [];
  }
  Track.prototype.reset = function() {
    var i, j, k;
    if (_gui) {
      for (i = 0; i < this.verses.length; i++) {
        this.verses[i].dom.className = '';
        for (j = 0; j < this.verses[i].lines.length; j++) {
          this.verses[i].lines[j].dom.className = '';
          for (k = 0; k < this.verses[i].lines[j].spans.length; k++) {
            this.verses[i].lines[j].spans[k].dom.className = '';
          }
        }
      }
    }
    this.verse = undefined;
  };
  Track.prototype.update = function(tt) {
    var i, j, k;
    for (i = this.verse ? this.verse : 0; i < this.verses.length; i++) {
      if (tt < this.verses[i].tt) break;
      if (i != this.verse) this.newVerse(i);
    }
    if (typeof this.verse == 'undefined') return;
    for (i = this.line ? this.line : 0; i < this.verses[this.verse].lines.length; i++) {
      if (tt < this.verses[this.verse].lines[i].tt) break;
      if (i != this.line) this.newLine(i);
    }
    for (i = this.span ? this.span : 0; i < this.verses[this.verse].lines[this.line].spans.length; i++) {
      if (tt < this.verses[this.verse].lines[this.line].spans[i].tt) break;
      if (i != this.span) this.newSpan(i);
    }
  };
  Track.prototype.oldVerse = function() {
    var i, j;
    if (_gui) {
      this.verses[this.verse].dom.className = 'past';
      for (i = 0; i < this.verses[this.verse].lines.length; i++) {
        this.verses[this.verse].lines[i].dom.className = 'past';
        for (j = 0; j < this.verses[this.verse].lines[i].spans.length; j++) this.verses[this.verse].lines[i].spans[j].dom.className = 'past';
      }
    }
    else {
      process.stdout.write('\r');
      for (i = 0; i < this.verses[this.verse].lines[this.line].spans.length; i++) process.stdout.write(this.verses[this.verse].lines[this.line].spans[i].txt);
    }
  };
  Track.prototype.newVerse = function(n) {
    if (n) this.oldVerse();
    if (_gui) this.verses[n].dom.className = 'current';
    else {
      process.stdout.write('\n');
      if (!n && this.title) process.stdout.write(this.title + '\n');
    }
    this.verse = n;
    this.line = undefined;
  };
  Track.prototype.oldLine = function() {
    var i;
    if (_gui) {
      this.verses[this.verse].lines[this.line].dom.className = 'past';
      for (i = 0; i < this.verses[this.verse].lines[this.line].spans.length; i++) this.verses[this.verse].lines[this.line].spans[i].dom.className = 'past';
    }
    else {
      process.stdout.write('\r');
      for (i = 0; i < this.verses[this.verse].lines[this.line].spans.length; i++) process.stdout.write(this.verses[this.verse].lines[this.line].spans[i].txt);
    }
  };
  Track.prototype.newLine = function(n) {
    if (n) this.oldLine();
    if (_gui) this.verses[this.verse].lines[n].dom.className = 'current';
    else {
      process.stdout.write('\n');
      for (var i = 0; i < this.verses[this.verse].lines[n].spans.length; i++) process.stdout.write(this.verses[this.verse].lines[n].spans[i].txt);
    }
    this.line = n;
    this.span = undefined;
  };
  Track.prototype.oldSpan = function() {
    if (_gui) {
      this.verses[this.verse].lines[this.line].spans[this.span].dom.className = 'past';
    }
  };
  Track.prototype.newSpan = function(n) {
    if (n) this.oldSpan();
    if (_gui) this.verses[this.verse].lines[this.line].spans[n].dom.className = 'current';
    else {
      process.stdout.write('\r\x1b[1m');
      for (var i = 0; i <= n; i++) process.stdout.write(this.verses[this.verse].lines[this.line].spans[i].txt);
      process.stdout.write('\x1b[0m');
    }
    this.span = n;
    setTimeout(expire(this, this.verse, this.line, this.span), 1000);
  };
  function expire(t, v, l, s) {
    return function() {
      if (v == t.verse && l == t.line && s == t.span) {
        if (s == t.verses[v].lines[l].spans.length - 1) {
          if (l == t.verses[v].lines.length - 1) t.oldVerse();
          else t.oldLine();
        }
        else t.oldSpan();
      }
    };
  }

  JZZ.gui.Karaoke = Karaoke;
});
