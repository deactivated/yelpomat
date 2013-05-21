var photo_template = '\
<div class="photo {{photo_id}}">\
  <div class="thumb-wrap">\
    <div class="photo-box biz-photo-box pb-ms">\
      <a href="?select={{photo_id}}">\
        <img class="photo-img" height="100" src="{{thumb_url}}" width="100">\
      </a>\
    </div>\
  </div>\
  <div class="caption">\
    <p class="smaller">{{ date_string }}</p>\
    <p class="smaller">{{ caption }}</p>\
  </div>\
</div>';

var overlay_template = '\
<div id="yelp-ext-image-overlay">\
<a class="zoom-in" href="">+</a>\
</div>';
