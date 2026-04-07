# WalletGamblingUI.gd
# NEON REIGN: AAA Gambling UI (STRICTLY OFF-PLATFORM)

extends Control

@onready var wallet_label = $Panel/VBoxContainer/WalletAddress
@onready var balance_label = $Panel/VBoxContainer/BalanceLabel

func _ready():
	_update_display()
	WalletDisplayManager.payment_request_ready.connect(_on_payment_request)

func _update_display():
	wallet_label.text = "CIVIC ID: %s" % WalletDisplayManager.player_wallet_address.substr(0, 10) + "..."
	# In a real game, this would be updated from the frontend via an autoload sync
	balance_label.text = "OFF-PLATFORM BALANCE: (Check Wallet App)"

func _on_payment_request(wallet: String, amount: float, desc: String):
	# Update local display with current request info
	print("[GAMBLING] UI updated for off-platform flow: %.2f to %s" % [amount, wallet])
