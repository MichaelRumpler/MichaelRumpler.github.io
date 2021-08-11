// Staticman comment replies (from https://github.com/mmistakes/made-mistakes-jekyll/blob/49632d19977e341b51c91dad8e71bf6ef88e79c3/src/assets/javascripts/main.js#L84-L181)
// modified from Wordpress https://core.svn.wordpress.org/trunk/wp-includes/js/comment-reply.js
var addComment = {
  moveForm: function( commId, parentId, respondId, postId ) {
    var div, element, style, cssHidden,
      t           = this,
      comm        = t.I( commId ),
      respond     = t.I( respondId ),
      cancel      = t.I( 'cancel-comment-reply-link' ),
      parent      = t.I( 'comment-parent' ),
      post        = t.I( 'comment-post-slug' ),
      commentForm = respond.getElementsByTagName( 'form' )[0];

    if ( ! comm || ! respond || ! cancel || ! parent || ! commentForm ) {
      return;
    }

    t.respondId = respondId;
    postId = postId || false;

    if ( ! t.I( 'sm-temp-form-div' ) ) {
      div = document.createElement( 'div' );
      div.id = 'sm-temp-form-div';
      div.style.display = 'none';
      respond.parentNode.insertBefore( div, respond );
    }

    comm.parentNode.insertBefore( respond, comm.nextSibling );
    if ( post && postId ) {
      post.value = postId;
    }
    parent.value = parentId;
    cancel.style.display = '';

    cancel.onclick = function() {
      var t       = addComment,
        temp    = t.I( 'sm-temp-form-div' ),
        respond = t.I( t.respondId );

      if ( ! temp || ! respond ) {
        return;
      }

      t.I( 'comment-parent' ).value = '';
      temp.parentNode.insertBefore( respond, temp );
      temp.parentNode.removeChild( temp );
      this.style.display = 'none';
      this.onclick = null;
      return false;
    };

    /*
      * Set initial focus to the first form focusable element.
      * Try/catch used just to avoid errors in IE 7- which return visibility
      * 'inherit' when the visibility value is inherited from an ancestor.
      */
    try {
      for ( var i = 0; i < commentForm.elements.length; i++ ) {
        element = commentForm.elements[i];
        cssHidden = false;

        // Modern browsers.
        if ( 'getComputedStyle' in window ) {
          style = window.getComputedStyle( element );
        // IE 8.
        } else if ( document.documentElement.currentStyle ) {
          style = element.currentStyle;
        }

        /*
          * For display none, do the same thing jQuery does. For visibility,
          * check the element computed style since browsers are already doing
          * the job for us. In fact, the visibility computed style is the actual
          * computed value and already takes into account the element ancestors.
          */
        if ( ( element.offsetWidth <= 0 && element.offsetHeight <= 0 ) || style.visibility === 'hidden' ) {
          cssHidden = true;
        }

        // Skip form elements that are hidden or disabled.
        if ( 'hidden' === element.type || element.disabled || cssHidden ) {
          continue;
        }

        element.focus();
        // Stop after the first focusable element.
        break;
      }

    } catch( er ) {}

    return false;
  },

  I: function( id ) {
    return document.getElementById( id );
  }
};

var verifyCaptcha = function(response) {
  if(response.length != 0)
  {
      var _el=$('#comment-form-submit');
      _el.removeAttr("disabled");
      _el.addClass('button-primary dark-blue-bg');
      _el.attr('aria-disabled', 'false');
      _el.attr('type', 'submit');

      if(typeof(Storage) != "undefined") {
        localStorage.fullname = $("#comment-form-name").val();
        localStorage.email = $("#comment-form-email").val();
      }
  }
};

$(function() {
  if(typeof(Storage) != "undefined") {
    $("#comment-form-name").val(localStorage.fullname);
    $("#comment-form-email").val(localStorage.email);
  }
});