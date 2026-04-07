# WalletManager.gd
# NEON REIGN P2P Wallet & Gambling System
# Smart-contract integrated betting, AI enforcement, UBI contribution

extends Node

signal balance_updated(new_balance)
signal bet_initiated(target_wallet, amount)
signal bet_result(winner, loser, amount)
signal contribution_sent(amount, recipient)
signal transaction_history_updated

var wallet_address: String = "0xCivicSovereignNode%X" % randi()
var community_wallet: String = "0xCivicCommunityTreasury"
var balance: float = 5000.0
var pending_bets = {}
var transaction_history = []

const VOLUNTARY_CONTRIBUTION_RATE = 0.01  # 1% microtax funds UBI
const MIN_BET = 10.0
const MAX_BET = 1000.0

func _ready():
	print("[WALLET] Initialized with balance: %.2f CIVIC" % balance)
	wallet_address = wallet_address % randi()

func initiate_p2p_bet(opponent_wallet: String, amount: float, match_id: String) -> bool:
	"""Initiate a P2P bet with another player."""
	if amount < MIN_BET or amount > MAX_BET:
		push_error("Bet amount must be between %.2f and %.2f" % [MIN_BET, MAX_BET])
		return false
	
	if balance < amount:
		push_error("Insufficient balance. Required: %.2f, Have: %.2f" % [amount, balance])
		return false
	
	var bet_id = "%s_%d" % [match_id, randi()]
	var bet_data = {
		"id": bet_id,
		"opponent": opponent_wallet,
		"amount": amount,
		"match_id": match_id,
		"created_at": Time.get_ticks_msec(),
		"status": "pending"
	}
	
	pending_bets[bet_id] = bet_data
	balance -= amount  # Escrow the bet
	
	emit_signal("bet_initiated", opponent_wallet, amount)
	emit_signal("balance_updated", balance)
	
	print("[BET] Initiated: %.2f CIVIC vs %s" % [amount, opponent_wallet.substr(0, 8)])
	
	# Simulate AI validation
	await get_tree().create_timer(0.5).timeout
	return true

func process_payout(winner_wallet: String, loser_wallet: String, amount: float, match_id: String) -> void:
	"""Process bet payout after match completion."""
	
	# Calculate community contribution (1% microtax)
	var contribution = amount * VOLUNTARY_CONTRIBUTION_RATE
	var net_payout = amount - contribution
	
	# Payout to winner
	balance += net_payout
	
	# Log transaction
	var transaction = {
		"type": "bet_payout",
		"winner": winner_wallet,
		"loser": loser_wallet,
		"amount": net_payout,
		"contribution": contribution,
		"match_id": match_id,
		"timestamp": Time.get_ticks_msec()
	}
	transaction_history.append(transaction)
	
	emit_signal("bet_result", winner_wallet, loser_wallet, amount)
	emit_signal("balance_updated", balance)
	emit_signal("contribution_sent", contribution, community_wallet)
	emit_signal("transaction_history_updated")
	
	CivicAvatarManager.update_reputation(10)
	
	print("[PAYOUT] Winner: %s | Amount: %.2f | Community Tax: %.2f" % [winner_wallet.substr(0, 8), net_payout, contribution])

func send_community_contribution(amount: float) -> bool:
	"""Voluntarily contribute CIVIC tokens to the UBI pool."""
	if amount <= 0 or balance < amount:
		return false
	
	balance -= amount
	var transaction = {
		"type": "voluntary_contribution",
		"amount": amount,
		"recipient": community_wallet,
		"timestamp": Time.get_ticks_msec()
	}
	transaction_history.append(transaction)
	
	emit_signal("contribution_sent", amount, community_wallet)
	emit_signal("balance_updated", balance)
	emit_signal("transaction_history_updated")
	
	CivicAvatarManager.update_reputation(5)
	
	print("[CONTRIBUTION] Sent %.2f CIVIC to UBI pool" % amount)
	return true

func get_balance() -> float:
	"""Get current wallet balance."""
	return balance

func get_transaction_history() -> Array:
	"""Get transaction history (last 20)."""
	return transaction_history.slice(-20)

func get_pending_bets() -> Dictionary:
	"""Get all pending bets."""
	return pending_bets

func cancel_bet(bet_id: String) -> bool:
	"""Cancel a pending bet and refund."""
	if not bet_id in pending_bets:
		return false
	
	var bet_data = pending_bets[bet_id]
	balance += bet_data["amount"]  # Refund
	pending_bets.erase(bet_id)
	
	emit_signal("balance_updated", balance)
	print("[BET CANCEL] Refunded %.2f CIVIC" % bet_data["amount"])
	
	return true
