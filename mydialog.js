var debug = true;
function _log(str){
	if(debug){
		console.log(str);
	}
}
function _inspect(obj,simple){
	_log(obj);
	for(var name in obj){
		if(simple){
			_log(name);
		}else{
			_log(name + ":"+ obj[name]);	
		}
	}
}
/**
 * Floating window 
 */
(function($){
	$.fn.tdxDialog  = function (options){
		options = $.extend({
			width: 'auto',
			title: $(this).attr('title')
		},options);
		var $dialog = $('<div class="tdxDialogContents"></div>');
		$('body').append($dialog);
		var methods = {
			onclick:function(ev,$element){
				var url = $element ? $element.attr('href') : $(this).attr('href');
				if(! url && $element){
					url = $element.attr('href');
				}
				$.ajax({
					type:'GET',
					url: url ,
					success:function(response,textStatus,jQueryXhr){
						
						response = methods.strip(response);
						$dialog.html(response);
						$dialog.dialog({
							autoOpen:true,
							width:options.width,
							show:'blind',
							disabled:true,
							modal:true,
							title: $element.attr('title'),
							close:function(evt,ui){
								$dialog.remove();
							},
							resizeStart:function(evt,ui){
								$dialog.dialog({ disabled: true });
							},
							resizeStop:function(evt,ui){
								$dialog.dialog({ disabled: false });
							}
						});
						methods.setButtons();
						$dialog.dialog("option", "position", "center");	
						$dialog.dialog({disabled:false});
					}// end of success fx
				});
				
				var _event = ev || window.event;
				
				if(_event){
					if(_event.preventDefault){
						_event.preventDefault();
					}else{
						_event.returnValue = false;
						_event.cancelBubble = true;
					}
				}
				return false;
			},
			setButtons:function(){
				var buttons =[];
				if($dialog.find('input:image').length){
					$dialog.find('input:image').each(function(index,object){
						buttons.push({
							text:$(object).attr('alt'),
							click:function(evt){
								methods.submit($dialog);
							}
						});
					});
					$dialog.find('input:image').remove();
				}else if($dialog.find('input:submit').length){
					$dialog.find('input:submit').each(function(index,object){
						buttons.push({
							text:$(object).attr('value'),
							click:function(evt){
								methods.submit($dialog);
							}
						});
					});
					$dialog.find('input:submit').remove();
				} 
				// add the close button
				buttons.push({
							text:'Close',
							click:function(evt){
								$dialog.remove();
							}
						});
				$dialog.dialog({buttons:buttons});
				// forward all input submit events to the main plugin submit methods
				$dialog.find('input').each(function(ev,element){
					$(element).bind('keydown', function(ev){
						var _event = window.event || ev;
						if(_event.keyCode == 13){//Return key
							return methods.submit();
						}
					});
				});
				
			},
			submit:function(){
				var $postData = $dialog.is('form') ? $dialog.serialize() : $dialog.find('form').serialize();
				$.ajax({
					type:'POST',
					dataType:'html',
					url: $dialog.find('form').first().attr('action'),
					data:$postData,
					success:methods.success,
				});
			},
			strip:function(str){
				var pattern = /[\s\S]*<body>([\s\S]*)<\/body>[\s\S]*/i;
				if(str.match(pattern)){
					return str.replace(pattern, '$1');	
				}
				pattern = /[\s\S]*?<\!--startAjax-->([\s\S]*)<\!--endAjax-->[\s\S]*/i;
				if(str.match(pattern)){
					return str.replace(pattern, '$1');	
				}
				return str;
			},
			success:function(response,textStatus, jXhr){
				var pat = methods.checkHeader(jXhr);
				if(pat == 1){
					$dialog.remove();
				}else if(pat == 2){
					// close the dialog and redirect the page to response
					$dialog.remove();
					var url = null;
					if(jXhr.getResponseHeader('HTTP_CUSTOM_REDIRECT')){
						url = decodeURIComponent((jXhr.getResponseHeader('HTTP_CUSTOM_REDIRECT')+'').replace(/\+/g, '%20'));
					}else{
						url = decodeURIComponent((response+'').replace(/\+/g, '%20'));
					}
					setTimeout(function(){
						window.location.href= url;
					}, 500);
				}else{
					// just insert the reponse into the dialog 
					response = methods.strip(response);
					$dialog.dialog({disabled:true});
					
					if($(response).is('form') || $(response).find('form').length){
						response = $(response).is('form') ? '<div>'+ response + '</div>' : response;
					}
					$dialog.html(response);
					methods.setButtons($dialog);
					$dialog.submit(function(evt){
						methods.submit();
					});
					$dialog.dialog({disabled:false});
				}
			},
			
			error:function(jqXHR, textStatus, errorThrown){
				$dialog.html($dialog.html() + '<p class="ui-state-error">Error Occurred!</p>');
			},
			checkHeader:function(jXhr){
				if(!jXhr.readyState == 4){
					return 0;
				}
				if(jXhr.getResponseHeader('ACTION_RESULT')){
					return 1;
				}
				if(jXhr.getResponseHeader('HTTP_CUSTOM_REDIRECT')){
					return 2;
				}
				return 0;
			}
		};// end of methods
		$(document).on('click','.tdxDialogContents a:not(".tdxConfirmDialog")',function(ev){
			options = $.extend({
				title: $(this).attr('title')
			},options);
			
			var $ui = $(ev.target).parent().is('a') ? $(ev.target).parent() : $(ev.target);
			return  methods.onclick(ev,$ui);
		});
		return this.each(function(){
			$(this).bind('click',function(ev){
				var _event = window.event || ev;
				methods.onclick(_event, $(this));
			});
		});
	};
})(jQuery); 

/**
 * tdxConfirmDialog 
 */
(function($){
	$.fn.tdxConfirmDialog = function(_options){
		// install the plugin on all future link with the class "tdxConfirmDialog"
		$(document).on({
			'click':function(ev){
				var $dialog = $('<div class="tdxConfirmDialogContents"></div>');
				var $ui = $(ev.target).parent().is('a') ? $(ev.target).parent() : $(ev.target);
				var options = $.extend({
					width: 'auto',
					title: 'Confirm',
					show: 'blind',
					content: $ui.attr('title')
				},_options);
				options = $.extend({
					content: $ui.attr('title')
				},options);
				$dialog.dialog({
					modal:true,
					autoOpen:false,
					disabled:true,
					show:options.show,
					width: options.width,
					title: options.title,
					close:function(evt,ui){
						$dialog.remove();
					},
					buttons:{
						"OK": function() {
							if($ui.is('a')){
								return location.href = $ui.attr('href');								
							}else if($ui.is('input')){
								var form = $ui.parents('form:first');
								form.submit();
							}else{
								_log('Elements of type = "' + $ui.tagName + '" cannot be handled by this plugin');
							}
							$dialog.remove();
						},
						"Cancel": function() {
							$dialog.remove();
						}
					}
				});
				
				$dialog.html(options.content);
				$dialog.dialog('open');
				$dialog.dialog('options','position','center');
				
				var _event = window.event || ev;
				if(_event){
					_event.preventDefault ? _event.preventDefault() : _event.returnValue = false;
				}
				return false;
			}
		}, 'a.tdxConfirmDialog');
	};// end of plugin tdxConfirmDialog
})(jQuery);
