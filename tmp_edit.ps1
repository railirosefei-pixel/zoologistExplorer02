$path = 'c:/zoologistExplorer02/src/components/ParentView.vue'
$text = Get-Content -Path $path -Raw

$pattern1 = '(?s)(data-font-option="styles"\s+type="button")'
$replacement1 = '$1`n                                                                :aria-pressed="isStylesMenuOpen"`n                                                                @click="toggleStylesMenu"'
$text = [regex]::Replace($text, $pattern1, $replacement1, 1)

$pattern2 = '(?s)(<button\s+class="text-editor-font-option-button"\s+data-font-option="font-size"\s+type="button"\s*>\s*Font Size\s*</button>\s*)(</div>)'
$replacement2 = '$1`n                                                        <div v-if="isStylesMenuOpen" class="text-editor-font-styles-menu" role="region" aria-label="Font styles">`n                                                                <button`n                                                                        v-for="fontOption in fontStyleOptions"`n                                                                        :key="fontOption.id"`n                                                                        class="text-editor-font-style-button"`n                                                                        type="button"`n                                                                        :data-font-style="fontOption.id"`n                                                                        :style="{ fontFamily: fontOption.family }"`n                                                                        @click="applyFontStyle(fontOption)"`n                                                                >`n                                                                        {{ fontOption.label }}`n                                                                </button>`n                                                        </div>`n$2'
$text = [regex]::Replace($text, $pattern2, $replacement2, 1)

Set-Content -Path $path -Value $text -Encoding utf8
