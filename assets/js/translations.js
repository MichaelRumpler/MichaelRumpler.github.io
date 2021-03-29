---
layout: empty
---

var translations = {
    locale: navigator.language.substr(0, 2),
    getTranslation: function(key)
    {
        if(this[this.locale] && this[this.locale][key])
            return this[this.locale][key];
        if(this["en"] && this["en"][key])
            return this["en"][key];
        return null;
    },
    translateAll: function()
    {
        $("[data-translate]").each(function(){
            var key = $(this).data('translate');
            var t = translations.getTranslation(key);
            if(t !== null)
                $(this).text(t);
        });
    },
    setLocale: function(newLocale)
    {
        if(this[newLocale])
        {
            this.locale = newLocale;
            this.translateAll();
        }
    },

{% for locale in site.data.ui-text %}{% if locale.first != "en" and locale.first != "de" %}{% continue %}{% endif %}
    "{{ locale.first }}": {
        {% for keyvaluepair in locale.last %}"{{ keyvaluepair.first }}": "{{ keyvaluepair.last }}"{% if forloop.last == false %},{% endif %}
        {% endfor %}
    }{% if forloop.last == false %},{% endif %}
{% endfor %}
};

$(document).ready(translations.translateAll);