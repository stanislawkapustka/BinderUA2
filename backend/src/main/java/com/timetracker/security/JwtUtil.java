package com.timetracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility for JWT token generation, validation, and claims extraction.
 * Uses HS256 algorithm with Base64-encoded secret key from configuration.
 * Embeds user role and language in JWT claims for authorization and localization.
 * Token expiration configurable via binderua.jwt.expiration-ms (default: 24 hours).
 */
@Component
public class JwtUtil {

    @Value("${binderua.jwt.secret}")
    private String secret;

    @Value("${binderua.jwt.expiration-ms}")
    private Long expirationMs;

    /**
     * Decode Base64 secret and create HMAC signing key.
     *
     * @return SecretKey for HS256 JWT signing
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate JWT token with user role and language embedded in claims.
     *
     * @param username Subject (user identifier)
     * @param role User role (PRACOWNIK, MANAGER, DYREKTOR)
     * @param language User language preference (PL, EN, UA)
     * @return Signed JWT token string
     */
    public String generateToken(String username, String role, String language) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("language", language);
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);
        
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validate token by checking username match and expiration.
     *
     * @param token JWT token to validate
     * @param username Expected username from token
     * @return True if token valid and not expired
     */
    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractLanguage(String token) {
        return extractClaim(token, claims -> claims.get("language", String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Long getExpirationMs() {
        return expirationMs;
    }
}
