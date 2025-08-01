from typing import Dict, Any
import json
def prettify_answers(user_query: str, qloo_data: Dict[str, Any]) -> str:
    """Main function called by main.py - generates the markdown report"""
    return generate_markdown_report(qloo_data)
def generate_markdown_report(qloo_data: Dict[str, Any]) -> str:
    """Generate sophisticated markdown report using Qloo's cultural intelligence"""
    user_prompt = qloo_data.get("user_prompt", "Business planning query")
    qloo_info = qloo_data.get("qloo_json", {})
    clusters = qloo_info.get("clusters", [])
    radius_m = qloo_info.get("radius_m", 6000)
    radius_km = round(float(radius_m) / 1000, 1)
    markdown = f"""
Based on Qloo's cultural data analysis for: **{user_prompt}**
We've identified {len(clusters)} distinct cultural segments within {radius_km}km radius, each with unique affinity patterns and audience characteristics.
---
"""
    for i, cluster in enumerate(clusters, 1):
        cluster_name = cluster.get("cluster_name", f"Segment {i}")
        lift_score = cluster.get("lift_score", 0)
        audience_size = cluster.get("audience_size", 0)
        entities = cluster.get("example_entities", [])
        if audience_size >= 1000:
            audience_str = f"{audience_size//1000}K"
        else:
            audience_str = str(audience_size)
        markdown += f"""
**Affinity Score:** {lift_score}% | **Estimated Audience:** {audience_str}
"""
        if entities:
            markdown += "**Key Cultural Signals:**\n"
            for entity in entities[:3]:
                entity_name = entity.get("name", "Unknown")
                entity_type = entity.get("type", "venue")
                affinity = entity.get("affinity", 0)
                keywords = entity.get("keywords", [])
                markdown += f"- **{entity_name}** ({entity_type}) - {affinity}% affinity\n"
                if keywords:
                    keyword_str = ", ".join(keywords[:3])
                    markdown += f"  *Cultural markers: {keyword_str}*\n"
            markdown += "\n"
        recommendations = generate_cluster_recommendations(cluster_name, lift_score, entities)
        if recommendations:
            markdown += f"**Strategic Recommendations:**\n{recommendations}\n"
        markdown += "---\n\n"
    markdown += generate_strategic_insights(clusters, user_prompt)
    return markdown
def generate_cluster_recommendations(cluster_name: str, lift_score: float, entities: list) -> str:
    """Generate specific recommendations based on cluster characteristics"""
    recommendations = []
    all_keywords = []
    for entity in entities:
        all_keywords.extend(entity.get("keywords", []))
    if "Japanese Culture" in cluster_name:
        recommendations.append("• Partner with authentic Japanese suppliers and cultural centers")
        recommendations.append("• Create traditional tea ceremony spaces for matcha service")
        recommendations.append("• Host Japanese cultural events and language exchange meetups")
        recommendations.append("• Source vintage Japanese vinyl and city-pop records directly from Japan")
    elif "Vinyl & Music" in cluster_name:
        recommendations.append("• Curate rare and limited-edition vinyl collections")
        recommendations.append("• Install high-quality listening stations with audiophile equipment")
        recommendations.append("• Host intimate listening parties and album release events")
        recommendations.append("• Create vinyl care and education workshops")
    elif "Arts & Culture" in cluster_name:
        recommendations.append("• Feature rotating exhibitions from local and international artists")
        recommendations.append("• Design Instagram-worthy, gallery-quality interior spaces")
        recommendations.append("• Host creative workshops and artistic collaboration events")
        recommendations.append("• Partner with museums and cultural institutions for cross-promotion")
    elif "Third Wave Coffee" in cluster_name:
        recommendations.append("• Source single-origin beans from specialty micro-roasters")
        recommendations.append("• Design cozy workspaces optimized for remote professionals")
        recommendations.append("• Offer coffee education, cupping sessions, and brewing workshops")
        recommendations.append("• Create seasonal menu rotations highlighting coffee terroir")
    elif "Craft Cocktail" in cluster_name:
        recommendations.append("• Develop signature cocktails inspired by Japanese flavors")
        recommendations.append("• Design sophisticated evening ambiance with premium spirits")
        recommendations.append("• Host sake tastings and Japanese whisky education events")
        recommendations.append("• Create craft cocktail pairing experiences with vinyl listening")
    elif "Mindful Wellness" in cluster_name:
        recommendations.append("• Incorporate organic, health-conscious menu options")
        recommendations.append("• Design calming environments with natural materials")
        recommendations.append("• Partner with local yoga studios and wellness practitioners")
        recommendations.append("• Offer meditation spaces and mindfulness workshops")
    elif "Authenticity Seekers" in cluster_name:
        recommendations.append("• Emphasize transparent sourcing and cultural storytelling")
        recommendations.append("• Build relationships with cultural community elders and experts")
        recommendations.append("• Create authentic cultural experiences, not superficial aesthetics")
        recommendations.append("• Document and share the cultural heritage behind your offerings")
    elif "Cultural Trendsetters" in cluster_name:
        recommendations.append("• Stay ahead of emerging cultural trends and seasonal movements")
        recommendations.append("• Create highly shareable, social media-optimized experiences")
        recommendations.append("• Partner with local influencers and cultural tastemakers")
        recommendations.append("• Launch limited-time cultural collaborations and pop-ups")
    elif "Neighborhood Loyalists" in cluster_name:
        recommendations.append("• Build deep relationships with long-term neighborhood residents")
        recommendations.append("• Create loyalty programs and community member benefits")
        recommendations.append("• Host neighborhood-specific events and local celebrations")
        recommendations.append("• Support local causes and community organizations")
    elif "Premium Experience" in cluster_name:
        recommendations.append("• Curate exclusive, members-only cultural experiences")
        recommendations.append("• Source rare and luxury cultural products and services")
        recommendations.append("• Design sophisticated, upscale environments and service")
        recommendations.append("• Create VIP cultural experiences and private events")
    elif "Conscious Culture" in cluster_name:
        recommendations.append("• Implement sustainable and ethical cultural practices")
        recommendations.append("• Partner with fair-trade and socially responsible suppliers")
        recommendations.append("• Create transparency in cultural sourcing and operations")
        recommendations.append("• Support cultural preservation and community empowerment")
    else:
        recommendations.append("• Engage authentically with local cultural preferences and traditions")
        recommendations.append("• Build genuine connections with cultural community leaders")
        recommendations.append("• Adapt offerings to reflect neighborhood cultural diversity")
        recommendations.append("• Create experiences that honor and celebrate local cultural heritage")
    if lift_score > 80:
        recommendations.append(f"• Exceptional affinity ({lift_score}%) - this segment should be your primary focus")
    elif lift_score > 75:
        recommendations.append(f"• Strong affinity ({lift_score}%) suggests excellent market fit - prioritize investment here")
    elif lift_score > 65:
        recommendations.append(f"• Solid affinity ({lift_score}%) - test and iterate to strengthen connection")
    elif lift_score > 50:
        recommendations.append(f"• Moderate affinity ({lift_score}%) - explore ways to deepen cultural resonance")
    return "\n".join(recommendations)
def generate_strategic_insights(clusters: list, user_prompt: str) -> str:
    """Generate overall strategic insights from all clusters"""
    if not clusters:
        return "No strategic insights available for the current clusters."
    total_audience = sum(cluster.get("audience_size", 0) for cluster in clusters)
    if len(clusters) > 0:
        avg_affinity = sum(cluster.get("lift_score", 0) for cluster in clusters) / len(clusters)
    else:
        avg_affinity = 0
    dominant_cluster = max(clusters, key=lambda c: c.get("lift_score", 0))
    dominant_name = dominant_cluster.get("cluster_name", "Unknown")
    dominant_score = dominant_cluster.get("lift_score", 0)
    insights = f"""
- **Total Addressable Audience:** {total_audience:,} potential customers
- **Average Cultural Affinity:** {avg_affinity:.1f}%
- **Primary Target Segment:** {dominant_name} ({dominant_score}% affinity)
"""
    if "Culture" in dominant_name:
        insights += """- **Cultural Authenticity First:** Prioritize genuine cultural connections over trendy aesthetics
- **Community Integration:** Build relationships with cultural community leaders and venues
- **Authentic Sourcing:** Work directly with cultural suppliers and artisans
"""
    elif "Music" in dominant_name:
        insights += """- **Sound Strategy:** Invest in quality audio systems and acoustic design
- **Programming Focus:** Develop consistent music programming that reflects local tastes
- **Artist Partnerships:** Build relationships with local musicians and promoters
"""
    elif "Arts" in dominant_name:
        insights += """- **Visual Impact:** Design spaces that serve as canvases for artistic expression
- **Creative Partnerships:** Collaborate with local galleries, artists, and creative spaces
- **Experience Design:** Create Instagram-worthy moments and artistic interactions
"""
    else:
        insights += """- **Local-First Approach:** Prioritize community integration and neighborhood fit
- **Authentic Positioning:** Build genuine connections rather than surface-level trends
- **Adaptive Strategy:** Stay flexible to evolve with local preferences and feedback
"""
    insights += f"""
- Track engagement with {dominant_name.lower()} through social media and foot traffic
- Monitor cross-pollination between the {len(clusters)} identified cultural segments
- Measure authentic community integration through local partnerships and word-of-mouth
*This analysis is powered by Qloo's cultural intelligence platform, analyzing real affinity data from local venues and cultural patterns.*
"""
    return insights
