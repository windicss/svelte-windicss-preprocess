var ghpages = require('gh-pages');

ghpages.publish('public', function (err) {
  console.log(err);
});
