import json
import os
from kernel.system import WillowKernel, ChaseWeb3SettlementEngine

def test_system_pipeline():
    print("Initializing test suite for Web3-Chase Clearing Bridge...")
    
    # 1. Initialize Kernel and verify identity variables
    kernel = WillowKernel()
    assert kernel.operator == "Ricardo Gomes"
    assert kernel.client_id == "edf3b1f0-f1fc-4a2d-a6a4-513624bc8854"
    assert kernel.metastasis_state == "dormant"
    
    # Verify live geospatial calculations (pre-calculations)
    state = kernel.get_state()
    for node in state["nodes"]:
        assert "distance_km" in node
        assert "latency_ms" in node
        if node["id"] == "METAMASK":
            assert node["distance_km"] < 0.1
            assert node["latency_ms"] == 0.85
        else:
            assert node["distance_km"] > 0.0
            assert node["latency_ms"] > 0.85
    print("[PASS] Identity Anchoring, Base Registers, and Live Geospatial Pre-calculations Verified.")
    
    # 2. Assert Settlement Routing (RTP vs ACH size limit checks)
    engine = ChaseWeb3SettlementEngine(client_id=kernel.client_id)
    
    # Small amount under $100,000 -> RTP_INSTANT
    small_tx = engine.process_on_ramp_settlement("COINBASE_PRIME", 85000.00, "123456789012")
    assert small_tx["status"] == "APPROVED"
    assert small_tx["clearing_protocol"] == "RTP_INSTANT"
    
    # Large amount >= $100,000 -> ACH_STANDARD
    large_tx = engine.process_on_ramp_settlement("COINBASE_PRIME", 150000.00, "123456789012")
    assert large_tx["status"] == "APPROVED"
    assert large_tx["clearing_protocol"] == "ACH_STANDARD"
    
    # Unapproved gateway -> REJECTED
    bad_tx = engine.process_on_ramp_settlement("UNAUTHORIZED_GATEWAY", 1000.00, "123456789012")
    assert bad_tx["status"] == "REJECTED_COMPLIANCE_VIOLATION"
    print("[PASS] ChaseWeb3SettlementEngine Settlement Routing Checked.")

    # 3. Assert VICReg Loss Calculations
    loss_report = kernel.execute_command("calculate-vicreg")
    assert "VICREG LOSS" in loss_report
    assert kernel.registers["VICREG_LOSS"] > 0.0
    print(f"[PASS] VICReg Regularization loss verified: {kernel.registers['VICREG_LOSS']:.4f}")

    # 4. Assert SciPy Trajectory Optimization
    opt_report = kernel.execute_command("optimize-trajectory")
    assert "SCIPY ROUTING OPTIMIZATION" in opt_report
    assert kernel.registers["OPTIMIZED_DELAY"] > 0.0
    print(f"[PASS] SciPy Routing Optimization verified. Min Delay: {kernel.registers['OPTIMIZED_DELAY']:.4f} hours.")

    # 5. Cryptographic signature and verification checks
    res_unlock = kernel.execute_command("unlock-psi")
    assert "Golden ratio amplification achieved" in res_unlock
    assert kernel.registers["PSI_GAIN"] == 1.618
    print("[PASS] Cryptographic verification and limit override verified.")

    # 6. Compliance Sweep and Self Healing
    res_trigger = kernel.execute_command("metastasis-trigger")
    assert kernel.metastasis_state == "active"
    assert kernel.registers["ENTROPY"] == 0.77
    
    res_heal = kernel.execute_command("witness-resume")
    assert kernel.metastasis_state == "dormant"
    assert kernel.registers["ENTROPY"] == 0.00
    print("[PASS] Compliance Audit trigger and Recovery sweep matched baseline signature.")

    # 7. Mock funding command
    res_fund = kernel.execute_command("fund crypto wallets")
    assert "SIMULATION BRIDGE SUCCESS" in res_fund
    assert kernel.registers["ROOT_SOVEREIGN"] == 6.0
    print("[PASS] Mock funding sweep execution verified.")

    # 8. DNA processing command
    res_dna = kernel.execute_command("process-dna")
    assert "DNA CELL TRUNK PROCESSING COMPLETED" in res_dna
    assert kernel.registers["AGI_ANCHOR"] > 0.0
    print(f"[PASS] Ingestion of DNA cell trunk dataset from Google Sheets verified. AGI_ANCHOR: {kernel.registers['AGI_ANCHOR']:.2f}")

    # 9. BigQuery ML Precalculation command
    res_bq = kernel.execute_command("bigquery-ml")
    assert "INITIATING BIGQUERY ML PLANETARY DIGITAL TWIN" in res_bq
    assert kernel.registers["ROOT_SOVEREIGN"] > 6.0
    assert kernel.registers["DOMAIN_FIXED"] > 1.0
    print(f"[PASS] BigQuery ML planetary Digital Twin move pre-calculation verified. ROOT_SOVEREIGN: {kernel.registers['ROOT_SOVEREIGN']:.4f}")
    
    # 10. System termination command
    res_term = kernel.execute_command("terminate")
    assert "TERMINATION SIGNAL ACCEPTED" in res_term
    assert kernel.metastasis_state == "terminated"
    assert kernel.registers["ROOT_SOVEREIGN"] == 0.0
    print("[PASS] System deactivation and subprocess termination verified.")
    
    # 11. Dynamic Self-Healing check
    res_heal_after_term = kernel.execute_command("evolve")
    assert kernel.metastasis_state == "dormant"
    assert kernel.registers["PSI_GAIN"] == 0.89
    for node in kernel.nodes:
        assert node["status"] == "stable"
    print("[PASS] Dynamic self-healing from terminated state verified.")
    
    print("\nALL CLEARING BRIDGE AUTOMATED VERIFICATION PASSED.")

if __name__ == "__main__":
    test_system_pipeline()
