<?php
// database/migrations/2024_01_01_000004_create_notes_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Tiêu chí 11-18: Notes
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 255);
            $table->longText('content')->nullable();
            $table->boolean('is_pinned')->default(false);         // Tiêu chí 17
            $table->string('note_password', 255)->nullable();     // Tiêu chí 18
            $table->enum('visibility', ['private', 'link', 'public'])->default('private');
            $table->timestamps();
            $table->index('user_id', 'idx_user_notes');
            $table->fullText(['title', 'content'], 'ft_notes_search'); // Tiêu chí 14
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
