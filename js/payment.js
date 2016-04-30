jQuery( document ).ready(function( $ ) {

function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}          


var destination = getUrlParameter('destination');
	pre_amount = getUrlParameter('amount');
if(destination) {
	$('#withdraw-address').val(destination);
}
if(pre_amount) {
	$('#amount').val(pre_amount);
}


$('.ssio-currency-dropdown').val('---');


function round(value, exp) {
  if (typeof exp === 'undefined' || +exp === 0)
    return Math.round(value);

  value = +value;
  exp  = +exp;

  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
    return NaN;

  // Shift
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

var ssio_protocol = "https://";
var spinner = '<div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
var deposit_type = '';
var altcoin_deposit_limit = ''; // defined here (globally) because it is used in a bunch of places
var crypto_data = {
    LTC: {symbol: 'LTC', name: "Litecoin", icon: "<img src='images/coins/litecoin.png'>"},
    PPC: {symbol: "PPC", name: "Peercoin", icon: "<img src='images/coins/peercoin.png'>"},
    DOGE: {symbol: "DOGE", name: "Dogecoin", icon: "<img src='images/coins/dogecoin.png'>"},
    DRK: {symbol: "DRK", name: "Darkcoin", icon: "<img src='images/coins/darkcoin.png'>"},
    BTC: {symbol: "BTC", name: "Bitcoin", icon: "<img src='images/coins/bitcoin.png'>"},
    NMC: {symbol: "NMC", name: "Namecoin", icon: "<img src='images/coins/namecoin.png'>"},
    FTC: {symbol: "FTC", name: "Feathercoin", icon: "<img src='images/coins/feathercoin.png'>"},
    BC: {symbol: "BC", name: "Blackcoin", icon: "<img src='images/coins/blackcoin.png'>"}
};


function show_error(msg) {
    // At any point in the process, if the shapeshift api returns any kind of error,
    // this text gets placed into the page.

	alert(msg);
}


function send_success_email(email, txid) {
    $.post(ssio_protocol + "shapeshift.io/mail", {
        email: email,
        txid: txid
    }).done(function (response) {
        console.log("sent email", response);
        if(response.error) {
            var to_display = response.error;
        } else {
            var to_display = response.email.message;
        }
        //$('#shapeshift-lens-modal .ssio-email-status-msg').text(to_display);
    }).error(function(response) {

        if(response.error == "I'm busy right now, sorry.") {
            // iterate while busy signal until the email gets successfully sent.
            setTimeout(function() {
                send_success_email(email, txid);
            }, 3000);
        }
    });

}


function getRates(rate_pair) {
	    $('.ssio-limit, .ssio-exchange-rate').fadeIn();
	    var altcoin_symbol = rate_pair;
	    var pair = "btc_" + altcoin_symbol;
	
	    $(".exchange-rate p").html(spinner);
	    $(".deposit-limit p").html(spinner);
		
	    $('#shapeshift-lens-modal .ssio-more-options').show();
	
	    $.get(ssio_protocol + "shapeshift.io/rate/" + pair, function(response) {
	        if(response.error) {
	            show_error("ShapeShift API returned an error: " + response.error);
	            return;
	        }
	        var rate = response.rate;
	        var formatted_rate = round(rate, 2);
	        $(".exchange-rate p").text("1 BTC = " + formatted_rate + " " + altcoin_symbol.toUpperCase());
	
	        $.get(ssio_protocol + "shapeshift.io/limit/" + pair, function(response) {
	            if(response.error) {
	                show_error(response.error);
	                return;
	            }
	            var btc_deposit_limit = response.limit;
	            altcoin_deposit_limit = (btc_deposit_limit * rate).toFixed(4);
	
	            $(".deposit-limit p").text(altcoin_deposit_limit + " " + altcoin_symbol.toUpperCase());
	            
	        }).error(function(response) {
	            show_error("General Ajax failure");
	        });
	
	    }).error(function(response) {
	        show_error("General Ajax failure");
	    });
}

$('.ssio-currency-dropdown').change(function(event) {
	$('#shapeshift-lens-modal .pay-with').fadeOut();
	if($(this).val() !== '---' && $(this).val() !== 'btc') {
	    // When the user selects which currency they want to pay with,
	    // show the further options, and make the pay button appear.
		$('.deposit-limit, .exchange-rate, .return-address-input, .email-input').fadeIn();
		var coin = $(this).val();
		getRates(coin);

	}
	if($(this).val() == 'btc') {
		$('.deposit-limit, .exchange-rate, .return-address-input, .email-input').fadeOut();
	}
});

function show_success(msg) {
	$('.status-message p').html(msg);
}

function btc_pay() {
		var deposit = $('#withdraw-address').val(); 
			amount = $('#amount').val();
			currency = $(".ssio-currency-dropdown").val();
			altcoin_name = crypto_data[currency.toUpperCase()].name;
			bitcoin_icon = crypto_data["BTC"].icon;
			qrstring = altcoin_name.toLowerCase()+":"+deposit;
			
		
		var first_inst = "";
		
		if(amount)
		{
			qrstring = altcoin_name.toLowerCase()+":"+deposit+"?amount="+amount;
			first_inst = "Send " + amount + " " + bitcoin_icon + " BTC to <br>" + "<span class='depo-address'>" + deposit + "</span>";
		} else {
			first_inst = "Send " + bitcoin_icon + " BTC to <br>" + "<span class='depo-address'>" + deposit + "</span>";
		}
        $(".instructions").find('.first').html(first_inst);
		
		$('.input-form').fadeOut('normal', function() {
			$(this).remove();
			$('.instructions').fadeIn();
		});
        
        new QRCode(document.getElementById("qr-code"), qrstring);
		
		$('.coin').fadeOut('normal', function(){
			$(this).hide();
			$('#qr-code').fadeIn();
		});

}

function pay_button_clicked(event) {
    // This function gets fired when the pay button is clicked. It fires off
    // the "shift" api call, then starts the timers.

    var btc_address = destination;
    var return_address = $('#return-address').val();
    var currency = $(".ssio-currency-dropdown").val();
    var altcoin_name = crypto_data[currency.toUpperCase()].name;
    var altcoin_icon = crypto_data[currency.toUpperCase()].icon;
    var bitcoin_icon = crypto_data["BTC"].icon;
	var email = $("#email").val();
    var pair = currency + "_btc";
    var btc_amount = $("#amount").val();

    //$("#shapeshift-lens-modal").html("Calling ShapeShift.io's API..." + spinner);

    if(btc_amount) {
        data = {withdrawal: btc_address, pair: pair, amount: btc_amount, returnAddress: return_address};
        url = "shapeshift.io/sendamount";
    } else {
        data = {withdrawal: btc_address, pair: pair};
        url = "shapeshift.io/shift";
    }

    $.post(ssio_protocol + url, data).done(function(response) {
        // This gets executed when the call to the API to get the deposit
        // address.

        if(response.error) {
            show_error(response.error);
            return;
        }
        //console.log(response);

        var amount = null;
        var expiration = null;
		var seconds_remaining = null;
        if(response.success) {
            // response came from call to 'sendamount'
            var deposit = response.success.deposit;
            var amount = response.success.depositAmount;
            expiration = response.success.expiration;
        } else {
            // response came from call to 'shift'
            var deposit = response.deposit;
             
        }

        var deposit_type = response.depositType;

        if(amount) {
            var show_amount = "<b>" + amount + "</b> ";
        } else {
            var show_amount = "up to <b>" + altcoin_deposit_limit + "</b>";
        }

        var first_inst = "Send " + show_amount + " " + altcoin_icon + " " + altcoin_name + " to <br>" + "<span class='depo-address'>" + deposit + "</span>";

        if(amount) {
			var second_inst = "It will be converted into " + btc_amount + ' ' + bitcoin_icon + " Bitcoin, and sent to<br>" + "<span class='depo-address'>" + btc_address + "</span>";
        } else {
	        var second_inst = "It will be converted into " + bitcoin_icon + " Bitcoin, and sent to<br>" + "<span class='depo-address'>" + btc_address + "</span>";
        }

        $(".instructions").find('.first').html(first_inst);
        $(".instructions").find('.last').html(second_inst);
        $('.depo-address').text(deposit);

		var qrstring = deposit;
		if(amount)
		{
			qrstring = altcoin_name.toLowerCase()+":"+deposit+"?amount="+amount;
		}
        new QRCode(document.getElementById("qr-code"), qrstring);
		
		$('.input-form').fadeOut('normal', function() {
			$(this).remove();
			$('.instructions').fadeIn();
		});
		
		$('.coin').fadeOut('normal', function(){
			$(this).hide();
			$('#qr-code').fadeIn();
		});
		
        var ticks = 0;
        interval_id = setInterval(function() {

            if(ticks % 8 == 0) {
                // every eight seconds get the current status of any deposits.
                // by making a call to shapeshift's api
                $.get(ssio_protocol + "shapeshift.io/txStat/" + deposit, {timeout: 4500}).done(function(response) {
                    var status = response.status;

                    if(status == 'no_deposits') {
						$('#steps #deposit').addClass('active');
                    } else if (status == 'received') {
                        //show_status("Status: Payment Received, waiting for confirmation. " + spinner);
                        $('#steps #deposit').removeClass('pending').addClass('good');
                        $('#exchange').addClass('active');
                        expiration = null;
                    } else if (status == 'complete') {
                        console.log(response);
                        var in_type = response.incomingType;
                        var incoming = response.incomingCoin;
                        var outgoing = response.outgoingCoin;
                        var withdraw = response.withdraw;
                        var txid = response.transaction;
						$('#exchange').removeClass('pending').addClass('good');
						$('#complete').removeClass('pending').addClass('good');
						$('.status-window').addClass('complete');
                        show_success("<p>" + incoming + " " + altcoin_icon + " " + in_type + " was converted to " + outgoing + " " + bitcoin_icon + " BTC and sent to " + "<strong>" + withdraw + "</strong></p>");
                        if(email) {
                            send_success_email(email, txid);
                        }
                        clearInterval(interval_id);
                        expiration = null;
                        return;
                    } else if (status == 'failed') {
                        show_error("ShapeShift.io API returned an error: " + response.error);
                        clearInterval(interval_id); //halt ticking process
                        return;
                    }
                });
					
            }
			
			$.get(ssio_protocol + "shapeshift.io/timeremaining/" + deposit, {timeout: 4500}).done(function(response) {
                    
					seconds_remaining = response.seconds_remaining;
                });

            if (seconds_remaining || expiration) {
				
                var seconds = seconds_remaining ? seconds_remaining : ((expiration - new Date()) / 1000).toFixed(0);
				var timeText = ""
				var sec = 0;
				if(seconds > 59)
				{
					var min = Math.floor(seconds / 60);
					sec = seconds - (min * 60);

					if(sec < 10)
					{
						sec = "0"+sec;
					}

					timeText = min+":"+sec;
				}
				else
				{
					if(seconds < 10)
					{
						sec = "0"+seconds;
					}

					timeText ="0:"+sec;
				}
				
                if(seconds > 0) {
                    $(".timer").text(timeText + " until expiration");
                } else {
                    show_error("Time Expired! Please try again.");
                    clearInterval(interval_id);
                    return;
                }
            } else {
                $(".timer").text('');
            }

            ticks++;
        }, 1000);

    }).error(function(response) {
        if(response.error) {
            show_error(response.error);
            return;
        }
    });
}


 $(".ssio-currency-dropdown").msDropDown();

	$('.form-submit').click(function(){
		if($('.ssio-currency-dropdown').val() !== '---' && $('.ssio-currency-dropdown').val() !== 'btc') {
			if($('#destination-address').val() != ''){
    			var re_coin = $('.ssio-currency-dropdown').val();
    			if($('#amount').val().length == 0) {
    				window.setInterval(function(){
    				  getRates(re_coin);
    				}, 30000);
    			}
    			pay_button_clicked();
    			$('.status-window').animate({
    				height: '154px'
    			}, 500, 'easeInOutExpo');
            }else{
                show_error('Destination address is required.');
            }
		}
		if($('.ssio-currency-dropdown').val() == 'btc') {
			btc_pay();
		}
		
	});
	
	
});