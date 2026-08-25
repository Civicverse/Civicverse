# WalletDisplayManager.gd
# NEON REIGN: CRITICAL TRANSACTION RULE ENFORCED
# NO FUNDS EVER PASS THROUGH THE PLATFORM. ALL PAYMENTS ARE OFF-PLATFORM ON-CHAIN.

extends Node

signal payment_request_ready(wallet_address: String, amount: float, description: String)
signal copy_to_clipboard_success(text: String)

var player_wallet_address: String = ""

func _ready():
	_fetch_player_wallet()
	print("[WALLET MANAGER] Off-platform enforcement active")

func _fetch_player_wallet():
	if OS.has_feature("web"):
		var js_data = JavaScriptBridge.eval("window.getCivicID ? JSON.stringify(window.getCivicID()) : '{}'")
		var json = JSON.parse_string(js_data)
		if json and json.has("wallet_address"):
			player_wallet_address = json.wallet_address

# --- P2P BETTING / GAMBLING ---
func request_p2p_wager(opponent_wallet: String, amount: float, match_title: String):
	"""
	Displays UI for a P2P bet. 
	Players must manually send funds to the opponent's wallet in their own app.
	"""
	var microtax = amount * 0.01
	var total = amount + microtax
	
	var description = "Bet on %s. Includes 1%% UBI contribution." % match_title
	emit_signal("payment_request_ready", opponent_wallet, total, description)
	print("[P2P WAGER] Displaying QR for %s to %s" % [total, opponent_wallet])

# --- STORE / COMMERCE ---
func request_store_purchase(seller_wallet: String, price: float, item_name: String):
	"""
	Displays UI for a store purchase.
	Shows seller's wallet and QR for off-platform payment.
	"""
	var description = "Purchase of %s" % item_name
	emit_signal("payment_request_ready", seller_wallet, price, description)
	print("[STORE PURCHASE] Displaying QR for %s to %s" % [price, seller_wallet])

# --- UTILS ---
func copy_address(address: String):
	DisplayServer.clipboard_set(address)
	emit_signal("copy_to_clipboard_success", "Wallet address copied!")

func get_wallet_address() -> String:
	return player_wallet_address if not player_wallet_address.is_empty() else "0xCivicUserWalletAddress"

func display_store_payment(item_name: String, price: float, seller_wallet: String) -> Dictionary:
	request_store_purchase(seller_wallet, price, item_name)
	return {
		"item": item_name,
		"price": price,
		"seller": seller_wallet,
		"qr_uri": generate_qr_uri(seller_wallet, price)
	}

func copy_address_to_clipboard(address: String) -> void:
	copy_address(address)

func confirm_transaction_initiated(tx_hash: String, amount: float) -> void:
	print("[WALLET MANAGER] Transaction logged: %s for %.2f CIVIC" % [tx_hash, amount])

func generate_qr_uri(address: String, amount: float) -> String:
	# Standards-compliant crypto URI (e.g. ethereum:0x... or monero:4...)
	return "ethereum:%s?value=%s" % [address, str(amount)]

func get_ubi_contribution_info() -> String:
	return "Every off-platform transaction includes a suggested 1% contribution to the Sovereign UBI Treasury."
