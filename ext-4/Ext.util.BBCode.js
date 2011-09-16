Ext.apply(Ext.util, {
    BBCode: {
        urlstart   : -1,
        noparse    : false,
        crlf2br    : true,
        opentags   : [],
        postfmt_re : /([\r\n])|(?:\[([a-z]{1,16})(?:=([^\x00-\x1F"'\(\)<>\[\]]{1,256}))?\])|(?:\[\/([a-z]{1,16})\])/ig,
        uri_re     : /^[-;\/\?:@&=\+\$,_\.!~\*'\(\)%0-9a-z]{1,512}$/i,
        number_re  : /^[\\.0-9]{1,8}$/i,
        color_re   : /^(:?black|silver|gray|white|maroon|red|purple|fuchsia|green|lime|olive|yellow|navy|blue|teal|aqua|#(?:[0-9a-f]{3})?[0-9a-f]{3})$/i,
        tagname_re : /^\/?(?:b|i|u|pre|samp|code|colou?r|size|noparse|url|s|q|blockquote)$/,

        parse : function(str) {
            var me = this,
                result, endtags, tag;

            me.crlf2br = true;

            if (me.opentags == null || me.opentags.length) {
                me.opentags = [];
            }

            result = str.replace(me.postfmt_re, Ext.Function.bind(me.textToHtml, me));

            if (me.noparse) {
                me.noparse = false;
            }

            if (me.opentags.length) {
                endtags = '';

                if (me.opentags[me.opentags.length - 1].bbtag === 'url') {
                    me.opentags.pop();
                    endtags += '">' + str.substr(me.urlstart, str.length - me.urlstart) + '</a>';
                }

                while (me.opentags.length) {
                    endtags += me.opentags.pop().etag;
                }
            }

            return endtags ? result + endtags : result;
        },

        taginfo_t: function(bbtag, etag) {
            this.bbtag = bbtag;
            this.etag = etag;
        },

        isValidTag: function(str) {
            if (!str || !str.length) {
                return false;
            }

            return this.tagname_re.test(str);
        },

        textToHtml: function(tag, m, tagType, tagAttr, endTag, offset, string) {
            var me = this;

            if (m && m.length) {
                if (!me.crlf2br) {
                    return tag;
                }

                switch (m) {
                    case '\r':
                        return '';
                    case '\n':
                        return '<br>';
                    }
                }

            tagType = String(tagType).toLowerCase();
            endTag  = String(endTag).toLowerCase();

            if (me.isValidTag(tagType)) {
                if (me.noparse) {
                    return '[' + tagType + ']';
                }

                if (me.opentags.length && me.opentags[me.opentags.length - 1].bbtag === 'url' && me.urlstart >= 0) {
                    return '[' + tagType + ']';
                }

                switch (tagType) {
                    case 'code':
                        me.opentags.push(new me.taginfo_t(tagType, '</code></pre>'));
                        me.crlf2br = false;
                        return '<pre><code>';
                    case 'pre':
                        me.opentags.push(new me.taginfo_t(tagType, '</pre>'));
                        me.crlf2br = false;
                        return '<pre>';
                    case 'color':
                    case 'colour':
                        if (!tagAttr || !me.color_re.test(tagAttr)) {
                            tagAttr = 'inherit';
                        }
                        me.opentags.push(new me.taginfo_t(tagType, '</span>'));
                        return '<span style="color: ' + tagAttr + '">';
                    case 'size':
                        if (!tagAttr || !me.number_re.test(tagAttr)) {
                            tagAttr = 1;
                        }
                        me.opentags.push(new me.taginfo_t(tagType, '</span>'));
                        return '<span style="font-size: ' + Math.min(Math.max(tagAttr, 0.7), 3) + 'em">';
                    case 's':
                        me.opentags.push(new me.taginfo_t(tagType, '</span>'));
                        return '<span style="text-decoration: line-through">';
                    case 'noparse':
                        me.noparse = true;
                        return '';
                    case 'url':
                        me.opentags.push(new me.taginfo_t(tagType, '</a>'));

                        if (tagAttr && me.uri_re.test(tagAttr)) {
                            me.urlstart = -1;
                            return '<a target="_blank" href="' + tagAttr + '">';
                        }

                        me.urlstart = tag.length + offset;

                        return '<a target="_blank" href="';
                    case 'q':
                    case 'blockquote':
                        me.opentags.push(new me.taginfo_t(tagType, '</' + tagType + '>'));
                        return tagAttr && tagAttr.length && me.uri_re.test(tagAttr) ? '<' + tagType + ' cite="' + tagAttr + '">' : '<' + tagType + '>';
                    default:
                        me.opentags.push(new me.taginfo_t(tagType, '</' + tagType + '>'));
                        return '<' + tagType + '>';
                }
            }

            if (me.isValidTag(endTag)) {
                if (me.noparse) {
                    if (endTag === 'noparse')  {
                        me.noparse = false;
                        return '';
                    }

                    return '[/' + endTag + ']';
                }

                if (!me.opentags.length || me.opentags[me.opentags.length-1].bbtag != endTag) {
                    return '<span style="color: red">[/' + endTag + ']</span>';
                }

                if (endTag === 'url') {
                    if (me.urlstart > 0) {
                        return '\">' + string.substr(me.urlstart, offset - me.urlstart) + me.opentags.pop().etag;
                    }

                    return me.opentags.pop().etag;
                } else if (endTag === 'code' || endTag === 'pre') {
                    me.crlf2br = true;
                }

                return me.opentags.pop().etag;
            }

            return tag;
        }
    }
});
