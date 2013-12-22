/*globals Mustache, chrome, photo_template */
(function () {
  "use strict";

  var biz_info = {}, image_info = [], image_idx = 0;

  function updateIndex(idx) {
    var meta;
    image_idx = idx;

    meta = image_info[idx];
    if (meta) {
      $("a[class='zoom-in']").attr('href', meta.full_url);
    }
  }

  function populateImages() {
    var $thumbs = $("#photo-thumbnails"), $h, i;

    $thumbs.empty();

    for (i = 0; image_info[i]; i++) {
      $h = $(Mustache.to_html(photo_template, image_info[i]))
        .data({
          index: i
        });
      $thumbs.append($h);
    }

  }

  function sortByImageDate(img1, img2) {
    // Sort in descending order
    var v1 = img1.timestamp, v2 = img2.timestamp;
    return (v1 < v2) ? 1 : (v1 > v2) ? -1 : 0;
  }

  function filterImage(image) {
    var url = "http://s3-media1.ak.yelpcdn.com/bphoto/" + image.photo_id;

    return {
      photo_id: image.photo_id,
      thumb_url: url + "/ms.jpg",
      full_url: url + "/o.jpg",
      date_string: image.time_uploaded,
      timestamp: Date.parse(image.time_uploaded),
      caption: image.photo_caption
    };
  }

  function handleNewImages(images) {
    images = images.photo_slice;
    image_info.unshift.apply(image_info, images.map(filterImage));
    image_info.sort(sortByImageDate);
  }

  function loadImages(biz_id, image_cnt, success) {
    var
      image_idx = 0,
      base_url = "http://www.yelp.com/biz_photos/" + biz_id + "/paginate",
      dfd = new jQuery.Deferred(),
      request_url, request_cnt = 0, complete_cnt = 0;

    function requestComplete() {
      complete_cnt++;
      console.log("complete: " + complete_cnt + " / " + request_cnt);
      if (complete_cnt === request_cnt) {
        console.log("done");
        dfd.resolve();
      }
    }

    function requestSucceeded(data) {
      success(data);
      requestComplete();
    }

    while (image_idx < image_cnt) {
      request_cnt++;

      request_url = base_url + "/" + image_idx;
      $.getJSON(request_url, requestSucceeded)
        .fail(requestComplete);
      image_idx += 20;
    }

    return dfd;
  }


  function extractBizDetails(html) {
    var rx = /initPhotoNavigation\([\s\S]*?,[\s\S]*?,[\s\S]*?,([\s\S]*?),([\s\S]*?),/,
      matches;
    matches = html.match(rx);

    return {
      image_count: parseInt(matches[1].trim(), 10),
      biz_id: matches[2].trim().replace(/"/g, '')
    };
  }

  function selectIndex(index) {
    var target_thumb = image_info[index].thumb_url;
    console.log(target_thumb);

    updateIndex(index);
    window.postMessage({
      type: "focus_thumb",
      url: target_thumb
    }, "*");
  }


  function handleLeftRight(direction) {
    var next_idx;
    if (direction === "left") {
      next_idx = (image_idx === 0) ?
          (image_info.length - 1) : (image_idx - 1);
    } else {
      next_idx = (image_idx === image_info.length - 1) ?
          0 : (image_idx + 1);
    }

    selectIndex(next_idx);
  }


  function hookEvents() {
    document.addEventListener('click', function (evt) {
      var parent_id, evt_src,
        $target = $(evt.target);

      parent_id = $target.parent().attr('id');
      if (parent_id === "selected-photo-main") {
        evt.stopImmediatePropagation();
        handleLeftRight("right");
      }

      if (/ms.jpg$/.test($target.attr('src'))) {
        console.log(evt.target);
        updateIndex($target.closest('div.photo').data('index'));
        console.log(image_idx);
      }

      if ($target.closest("#yelp-ext-image-overlay").length) {
        evt.stopImmediatePropagation();
      }
    }, true);

    document.addEventListener('keydown', function (evt) {
      if (evt.keyCode === 39) {
        evt.stopImmediatePropagation();
        handleLeftRight("right");
      } else if (evt.keyCode === 37) {
        evt.stopImmediatePropagation();
        handleLeftRight("left");
      }
    }, true);
  }

  function insertImageOverlay() {
    var $h;

    $h = $(Mustache.to_html(overlay_template));
    $("#selected-photo-frame > div")
      .append($h)
      .mouseenter(function () {
        $h.fadeIn(50);
      })
      .mouseleave(function () {
        $h.fadeOut(50);
      });
  }

  function injectAssets() {
    var tag = document.createElement('script');
    tag.setAttribute('src', chrome.extension.getURL("injected.js"));
    document.body.appendChild(tag);

    tag = document.createElement('link');
    tag.setAttribute('href', chrome.extension.getURL("styles.css"));
    tag.setAttribute('rel', "stylesheet");
    tag.setAttribute('type', "text/css");
    document.head.appendChild(tag);
  }

  function selectZero() {
    console.log('select 0');
    selectIndex(0);
  }

  function waitForLoaded() {
    var dfd = new jQuery.Deferred(),
      fail_count = 0;

    function watchThrobber() {
      if ($("#selected-photo-frame").hasClass("mega-throbber") === false &&
          $("#photo-thumbnails > *:first").length > 0) {
        dfd.resolve();
      } else {
        if (fail_count++ < 500) {
          window.setTimeout(watchThrobber, 50);
        }
      }
    }

    window.setTimeout(watchThrobber, 50);
    return dfd;
  }

  injectAssets();
  hookEvents();

  biz_info = extractBizDetails(document.body.innerHTML);

  populateImages();

  $.when(loadImages(biz_info.biz_id, biz_info.image_count, handleNewImages),
         waitForLoaded())
    .then(function () {
      populateImages();
      insertImageOverlay();
      window.setTimeout(selectZero, 50);
    });
}());
