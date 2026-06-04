package com.carbonexchange.tradingengine.infrastructure.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    BigDecimal moneyBalance,
    BigDecimal creditBalance
) {}
