// `mode` can be :
//  - 'toggle' only one track per step can be active
//  - 'normal' there is no restriction in active steps
exports.grid = function(container, mode, trackCount, stepCount) {

  var grid = $('<div>', { class: 'grid' }).appendTo(container)

  _.forEach(_.range(trackCount), function(trackId) {
    var track = $('<div>', { class: 'track track-' + trackId }).appendTo(grid)
    _.forEach(_.range(stepCount), function(stepId) {
      $('<div>', { class: 'step step-' + stepId }).appendTo(track)
        .click(function() {
          var cls = $(this).attr('class')
          if (mode === 'toggle')
            grid.find('.step-' + stepId).removeClass('active')
          $(this).attr('class', cls).toggleClass('active')
        })
    })
  })

  return grid

}

// `onToggleClick(active)` is called when the toggle is clicked. 
exports.toggle = function(onToggleClick) {

  return $('<div>', { class: 'toggle' }).click(function() {
    $(this).toggleClass('active')
    onToggleClick.call(this, $(this).hasClass('active'))
  })

}