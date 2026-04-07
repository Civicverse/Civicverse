# BettingUI.gd
# NEON REIGN: AAA P2P Betting UI (STRICTLY OFF-PLATFORM)

extends Control

@onready var opponent_label = $BetPanel/VBoxContainer/OpponentLabel
@onready var amount_input = $BetPanel/VBoxContainer/AmountInput
@onready var qr_display = $BetPanel/VBoxContainer/QRDisplay
@onready var instructions_label = $BetPanel/VBoxContainer/InstructionsLabel

func _ready():
	WalletDisplayManager.payment_request_ready.connect(_on_payment_request)
	visible = false

func show_bet_prompt(opponent_name: String, opponent_wallet: String):
	opponent_label.text = "Challenge: %s" % opponent_name
	visible = true
	# Reset UI
	qr_display.texture = null
	instructions_label.text = "Enter amount and check your wallet app."

func _on_confirm_bet_pressed():
	var amount = float(amount_input.text)
	var opponent_wallet = "0xExampleOpponentAddress" # In real use, passed from the challenge
	
	WalletDisplayManager.request_p2p_wager(opponent_wallet, amount, "The Foyer Arena")

func _on_payment_request(wallet: String, total: float, desc: String):
	# Show the wallet and instructions
	instructions_label.text = "SEND TO: %s\nTOTAL: %.2f (Includes 1%% UBI Tax)" % [wallet, total]
	# Update QR code with deep link
	var uri = WalletDisplayManager.generate_qr_uri(wallet, total)
	_generate_qr_placeholder(uri)
	
	print("[BET UI] Payment request displayed for off-platform completion")

func _generate_qr_placeholder(uri: String):
	# Real implementation would use a QR generator plugin
	# For now, we show a 'copy' button and the address clearly
	pass

func _on_copy_address_pressed():
	var wallet = "0xExampleOpponentAddress"
	WalletDisplayManager.copy_address(wallet)
