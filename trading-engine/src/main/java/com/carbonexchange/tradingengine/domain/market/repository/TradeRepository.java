package com.carbonexchange.tradingengine.domain.market.repository;

import com.carbonexchange.tradingengine.domain.market.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TradeRepository extends JpaRepository<Trade, UUID> {
}
