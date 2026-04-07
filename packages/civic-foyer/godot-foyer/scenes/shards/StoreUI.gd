# StoreUI.gd
# Store UI Controller - Off-platform payment integration for shopping carts
# Design rule: GAME NEVER HANDLES TOKENS. Only displays wallet addresses and QR codes.

extends Control

signal purchase_initiated(item_name: String, price: float, seller_wallet: String)
signal cart_updated(items: Array)

@onready var item_list = $Panel/VBoxContainer/ItemList
@onready var cart_list = $Panel/VBoxContainer/CartList
@onready var total_label = $Panel/VBoxContainer/TotalLabel
@onready var checkout_panel = $Panel/VBoxContainer/CheckoutPanel
@onready var payment_qr = $Panel/VBoxContainer/CheckoutPanel/QRDisplay
@onready var payment_address = $Panel/VBoxContainer/CheckoutPanel/AddressLabel
@onready var copy_button = $Panel/VBoxContainer/CheckoutPanel/CopyButton

# Store inventory (simulated)
var store_inventory = [
	{"name": "Neon Tactical Vest", "price": 250.0, "description": "Advanced PBR armor cosmetic"},
	{"name": "Energy Blaster Skin", "price": 150.0, "description": "Neon cyan weapon wrap"},
	{"name": "Holographic Visor", "price": 80.0, "description": "HUD enhancement cosmetic"},
	{"name": "Sprint Boots", "price": 120.0, "description": "Footwear cosmetic"},
	{"name": "Holo-Backpack", "price": 200.0, "description": "Back cosmetic with glow"},
	{"name": "Reputation Badge L", "price": 50.0, "description": "Display your status"},
]

var shopping_cart = []
var cart_total = 0.0
var seller_wallet = "0xNeonReign_CivicStore"  # Off-platform seller wallet

func _ready():
	# Initialize UI
	refresh_item_list()
	hide_checkout_panel()
	
	# Connect buttons
	if item_list:
		item_list.item_activated.connect(_on_item_selected)
	if copy_button:
		copy_button.pressed.connect(_on_copy_address)
	
	print("[STORE UI] Ready - off-platform payment mode enabled")

func refresh_item_list():
	"""Display available store items."""
	if not item_list:
		return
	
	item_list.clear()
	for i in range(store_inventory.size()):
		var item = store_inventory[i]
		var display_text = "%s - %.2f CIVIC" % [item["name"], item["price"]]
		item_list.add_item(display_text)
		item_list.set_item_metadata(i, item)

func _on_item_selected(index: int):
	"""Add item to cart on selection."""
	if index < 0 or index >= store_inventory.size():
		return
	
	var item = store_inventory[index]
	add_to_cart(item)

func add_to_cart(item: Dictionary):
	"""Add an item to the shopping cart."""
	shopping_cart.append(item)
	cart_total += item["price"]
	
	refresh_cart_display()
	emit_signal("cart_updated", shopping_cart)
	print("[CART] Added: %s | Total: %.2f CIVIC" % [item["name"], cart_total])

func remove_from_cart(item_index: int):
	"""Remove an item from cart."""
	if item_index < 0 or item_index >= shopping_cart.size():
		return
	
	var item = shopping_cart[item_index]
	cart_total -= item["price"]
	shopping_cart.pop_at(item_index)
	
	refresh_cart_display()
	emit_signal("cart_updated", shopping_cart)

func refresh_cart_display():
	"""Update cart UI display."""
	if not cart_list:
		return
	
	cart_list.clear()
	for i in range(shopping_cart.size()):
		var item = shopping_cart[i]
		var line = "%s - %.2f" % [item["name"], item["price"]]
		cart_list.add_item(line)
	
	if total_label:
		total_label.text = "Cart Total: %.2f CIVIC" % cart_total

func initiate_checkout():
	"""Load the off-platform payment flow."""
	if shopping_cart.is_empty():
		print("[STORE] Cart is empty")
		return
	
	print("[CHECKOUT] Initiating off-platform payment...")
	emit_signal("purchase_initiated", "Store Bundle", cart_total, seller_wallet)
	
	# Display payment instructions
	show_checkout_panel()

func show_checkout_panel():
	"""Show off-platform payment instructions."""
	if not checkout_panel:
		return
	
	# Get payment display from WalletDisplayManager
	var payment_request = WalletDisplayManager.display_store_payment(
		"Store Purchase",
		cart_total,
		seller_wallet
	)
	
	# Display seller wallet address (where player sends funds)
	if payment_address:
		payment_address.text = "Send %.2f CIVIC to:\n%s" % [
			cart_total,
			seller_wallet
		]
		payment_address.add_theme_color_override("font_color", Color.CYAN)
	
	# Display QR code data (for real implementation, render actual QR)
	if payment_qr:
		payment_qr.text = "█ QR Code: %s █\n(Scan to pay)" % seller_wallet.substr(0, 16)
		payment_qr.add_theme_color_override("font_color", Color.LIME)
	
	checkout_panel.show()
	print("[PAYMENT UI] Displayed seller wallet: %s" % seller_wallet.substr(0, 8))

func hide_checkout_panel():
	"""Hide checkout panel."""
	if checkout_panel:
		checkout_panel.hide()

func _on_copy_address():
	"""Copy seller wallet address to player's clipboard."""
	WalletDisplayManager.copy_address_to_clipboard(seller_wallet)
	if copy_button:
		copy_button.text = "✓ Copied!"
		await get_tree().create_timer(2.0).timeout
		copy_button.text = "Copy Address"

func confirm_payment_completed(tx_hash: String):
	"""
	Called when player confirms they've sent the payment on-chain.
	Game logs this but NEVER verifies or modifies funds.
	Smart contract will settle the transaction off-chain.
	"""
	WalletDisplayManager.confirm_transaction_initiated(tx_hash, cart_total)
	
	# Clear cart after confirmation
	shopping_cart.clear()
	cart_total = 0.0
	refresh_cart_display()
	hide_checkout_panel()
	
	print("[STORE] Payment confirmed on-chain: %s" % tx_hash.substr(0, 16))
	print("[STORE] Awaiting smart contract settlement (off-platform)")

func get_cart_total() -> float:
	"""Return current cart total."""
	return cart_total

func is_cart_empty() -> bool:
	"""Check if cart is empty."""
	return shopping_cart. is_empty()

func export_cart_for_contracts() -> Dictionary:
	"""
	Export cart data for smart contract execution.
	Contains seller wallet and items, ready for off-platform settlement.
	"""
	var export_data = {
		"seller": seller_wallet,
		"buyer": WalletDisplayManager.get_wallet_address(),
		"items": shopping_cart,
		"total_amount": cart_total,
		"timestamp": Time.get_ticks_msec(),
		"requires_on_chain_settlement": true
	}
	return export_data
